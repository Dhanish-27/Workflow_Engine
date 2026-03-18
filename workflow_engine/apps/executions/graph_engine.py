"""
Graph-based Workflow Execution Engine.

This module implements the core workflow execution logic:
1. Start execution from the start step
2. Execute step based on step type (APPROVAL, TASK, NOTIFICATION)
3. Evaluate rules to determine next step
4. Handle loop detection and control
5. Complete or fail based on conditions
"""
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from apps.rules.models import Rule
from apps.rules.services.rule_engine import select_next_step
from apps.executions.models import WorkflowExecution, StepExecution, ExecutionLog
from apps.accounts.models import User
from apps.notifications.services import (
    notify_approval_required,
    notify_approved,
    notify_completed,
)
from apps.emails.services import (
    send_approval_required_email,
    send_approved_email,
    send_completed_email,
)
import logging

logger = logging.getLogger(__name__)


class GraphExecutionEngine:
    """
    Graph-based workflow execution engine.
    
    Handles:
    - Starting workflow execution
    - Step execution based on type
    - Rule evaluation for routing
    - Loop detection and control
    - Execution state management
    """
    
    # Maximum total steps to prevent infinite loops
    MAX_TOTAL_STEPS = 50
    
    # Maximum times a single step can be executed (loop limit)
    MAX_STEP_LOOP = 5
    
    def __init__(self, workflow_execution: WorkflowExecution):
        """
        Initialize the execution engine.
        
        Args:
            workflow_execution: The WorkflowExecution instance to process
        """
        self.workflow_execution = workflow_execution
        self.workflow = workflow_execution.workflow
        self.data = workflow_execution.data or {}
    
    def start(self):
        """
        Start or resume the workflow execution.
        
        Returns:
            dict: Result with status and details
        """
        try:
            with transaction.atomic():
                # If no current step, start from beginning
                if not self.workflow_execution.current_step:
                    start_step = self.workflow.get_start_step()
                    
                    if not start_step:
                        return {
                            'success': False,
                            'error': 'No start step defined for workflow'
                        }
                    
                    self.workflow_execution.current_step = start_step
                    self.workflow_execution.save()
                
                # Process the execution
                return self._process()
                
        except Exception as e:
            logger.exception(f"Error in workflow execution {self.workflow_execution.id}")
            self.workflow_execution.mark_failed(str(e))
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process(self):
        """
        Process the current step and determine next steps.
        
        Returns:
            dict: Result with execution status
        """
        current_step = self.workflow_execution.current_step
        
        if not current_step:
            return self._complete()
        
        # Check if we've exceeded max steps
        if self.workflow_execution.total_steps_executed >= self.MAX_TOTAL_STEPS:
            return self._fail("Maximum step limit exceeded")
        
        # Get or create step execution record
        step_execution, created = StepExecution.objects.get_or_create(
            workflow_execution=self.workflow_execution,
            step=current_step,
            defaults={
                'status': 'IN_PROGRESS',
                'execution_count': 0
            }
        )
        
        # Increment execution count and check loop limit
        can_continue, error = step_execution.increment_execution_count()
        
        if not can_continue:
            return self._fail(error)
        
        # Execute step based on type
        step_result = self._execute_step(current_step, step_execution)
        
        if not step_result['can_continue']:
            # Step requires user action (approval/task), pause execution
            return step_result
        
        # Step completed, evaluate rules to get next step
        return self._move_to_next_step(current_step, step_execution, step_result)
    
    def _execute_step(self, step, step_execution):
        """
        Execute a step based on its type.
        
        Args:
            step: The Step object to execute
            step_execution: The StepExecution record
            
        Returns:
            dict: Result with can_continue flag and details
        """
        if step.step_type == 'APPROVAL':
            return self._execute_approval_step(step, step_execution)
        elif step.step_type == 'TASK':
            return self._execute_task_step(step, step_execution)
        elif step.step_type == 'NOTIFICATION':
            return self._execute_notification_step(step, step_execution)
        else:
            # Unknown step type, treat as completed
            return {
                'can_continue': True,
                'result_data': {}
            }
    
    def _execute_approval_step(self, step, step_execution):
        """
        Execute an approval step.
        
        Args:
            step: The Approval Step
            step_execution: The StepExecution record
            
        Returns:
            dict: Result - pauses execution waiting for approval
        """
        # Check if approval already exists in step execution data
        approval_status = step_execution.result_data.get('approval_status')
        
        if approval_status:
            # Approval already given, continue
            return {
                'can_continue': True,
                'result_data': step_execution.result_data
            }
        
        # Wait for approval - set pending status
        step_execution.status = 'PENDING'
        step_execution.save()
        
        # Send approval notifications
        try:
            # Get the legacy execution for compatibility
            legacy_execution = self._get_or_create_legacy_execution()
            notify_approval_required(legacy_execution)
            send_approval_required_email(legacy_execution)
        except Exception as e:
            logger.warning(f"Failed to send approval notification: {e}")
        
        return {
            'can_continue': False,
            'status': 'PENDING',
            'message': f'Waiting for approval: {step.name}',
            'requires_action': True,
            'action_type': 'approval',
            'step': {
                'id': str(step.id),
                'name': step.name,
                'approval_type': step.approval_type
            }
        }
    
    def _execute_task_step(self, step, step_execution):
        """
        Execute a task step.
        
        Args:
            step: The Task Step
            step_execution: The StepExecution record
            
        Returns:
            dict: Result - pauses execution waiting for task completion
        """
        # Check if task is already completed
        task_completed = step_execution.result_data.get('task_completed', False)
        
        if task_completed:
            # Task already completed, continue
            return {
                'can_continue': True,
                'result_data': step_execution.result_data
            }
        
        # Check if there's a linked task in legacy system
        from apps.executions.models import Task
        
        existing_task = Task.objects.filter(
            execution=self._get_or_create_legacy_execution(),
            step=step,
            status='pending'
        ).first()
        
        if existing_task:
            step_execution.status = 'PENDING'
            step_execution.save()
            
            return {
                'can_continue': False,
                'status': 'PENDING',
                'message': f'Waiting for task completion: {step.name}',
                'requires_action': True,
                'action_type': 'task',
                'step': {
                    'id': str(step.id),
                    'name': step.name
                }
            }
        
        # No task found, check if we should auto-complete or create task
        # For now, auto-complete if no specific assignment
        if not step.assigned_to and not step.assigned_role:
            step_execution.complete({'task_completed': True})
            return {
                'can_continue': True,
                'result_data': {'task_completed': True}
            }
        
        # Create task for assignment
        assigned_user = step.assigned_to
        if not assigned_user and step.assigned_role:
            # Get first user with the role
            assigned_user = User.objects.filter(role=step.assigned_role).first()
        
        if assigned_user:
            legacy_execution = self._get_or_create_legacy_execution()
            
            Task.objects.create(
                execution=legacy_execution,
                step=step,
                assigned_to=assigned_user,
                title=step.name,
                description=step.description,
                form_fields=step.form_fields,
                task_type=step.task_template or 'generic',
                verify_fields=[],
                original_data=self.data.copy() if self.data else {},
                status='pending'
            )
            
            step_execution.status = 'PENDING'
            step_execution.save()
            
            return {
                'can_continue': False,
                'status': 'PENDING',
                'message': f'Waiting for task completion: {step.name}',
                'requires_action': True,
                'action_type': 'task',
                'step': {
                    'id': str(step.id),
                    'name': step.name
                }
            }
        
        # No assignment possible, auto-complete
        step_execution.complete({'task_completed': True})
        return {
            'can_continue': True,
            'result_data': {'task_completed': True}
        }
    
    def _execute_notification_step(self, step, step_execution):
        """
        Execute a notification step.
        
        Notification steps automatically complete and send notifications.
        
        Args:
            step: The Notification Step
            step_execution: The StepExecution record
            
        Returns:
            dict: Result - always continues
        """
        # Send notification
        try:
            legacy_execution = self._get_or_create_legacy_execution()
            notify_approval_required(legacy_execution)  # Reuse for now
        except Exception as e:
            logger.warning(f"Failed to send notification: {e}")
        
        # Complete the step
        step_execution.complete({'notification_sent': True})
        
        return {
            'can_continue': True,
            'result_data': {'notification_sent': True}
        }
    
    def _move_to_next_step(self, current_step, step_execution, step_result):
        """
        Evaluate rules and move to the next step.
        
        Args:
            current_step: The current step that completed
            step_execution: The StepExecution record
            step_result: Result from step execution
            
        Returns:
            dict: Result with next step or completion
        """
        # Complete the step execution
        step_execution.complete(step_result.get('result_data', {}))
        
        # Increment total steps
        self.workflow_execution.increment_step_count()
        
        # Evaluate rules to get next step
        next_step, selected_rule, evaluated_rules = select_next_step(
            current_step, 
            self.data
        )
        
        # Log the transition
        ExecutionLog.objects.create(
            execution=self._get_or_create_legacy_execution(),
            step_name=current_step.name,
            step_type=current_step.step_type,
            evaluated_rules=evaluated_rules,
            selected_next_step=str(next_step.id) if next_step else None,
            status="completed",
            started_at=timezone.now(),
            ended_at=timezone.now()
        )
        
        if not next_step:
            # No next step - check if current step is an end step
            if current_step.is_end:
                return self._complete()
            else:
                return self._fail(f"No outgoing rules from step '{current_step.name}'")
        
        # Move to next step
        self.workflow_execution.current_step = next_step
        self.workflow_execution.save()
        
        # Continue processing
        return self._process()
    
    def _complete(self):
        """
        Complete the workflow execution.
        
        Returns:
            dict: Success result
        """
        self.workflow_execution.mark_completed()
        
        # Send completion notifications
        try:
            legacy_execution = self._get_or_create_legacy_execution()
            notify_completed(legacy_execution)
            send_completed_email(legacy_execution)
        except Exception as e:
            logger.warning(f"Failed to send completion notification: {e}")
        
        return {
            'success': True,
            'status': 'COMPLETED',
            'message': 'Workflow completed successfully',
            'total_steps': self.workflow_execution.total_steps_executed
        }
    
    def _fail(self, error_message: str):
        """
        Fail the workflow execution.
        
        Args:
            error_message: Reason for failure
            
        Returns:
            dict: Failure result
        """
        self.workflow_execution.mark_failed(error_message)
        
        return {
            'success': False,
            'status': 'FAILED',
            'error': error_message
        }
    
    def _get_or_create_legacy_execution(self):
        """
        Get or create a legacy Execution for compatibility.
        
        Returns:
            Execution: Legacy execution instance
        """
        from apps.executions.models import Execution
        
        execution, created = Execution.objects.get_or_create(
            workflow=self.workflow,
            defaults={
                'workflow_version': self.workflow.version,
                'status': 'in_progress',
                'data': self.data,
                'current_step': self.workflow_execution.current_step,
                'triggered_by': self.workflow_execution.triggered_by
            }
        )
        return execution
    
    def process_approval(self, user, action: str, comment: str = ""):
        """
        Process an approval action.
        
        Args:
            user: The user performing the approval
            action: 'approve' or 'reject'
            comment: Optional comment
            
        Returns:
            dict: Result of processing
        """
        current_step = self.workflow_execution.current_step
        
        if not current_step or current_step.step_type != 'APPROVAL':
            return {
                'success': False,
                'error': 'Current step is not an approval step'
            }
        
        # Get or create step execution
        step_execution, created = StepExecution.objects.get_or_create(
            workflow_execution=self.workflow_execution,
            step=current_step,
            defaults={
                'status': 'IN_PROGRESS',
                'execution_count': 0
            }
        )
        
        # Store approval result
        step_execution.result_data = {
            'approval_status': action,
            'approved_by': str(user.id),
            'comment': comment
        }
        step_execution.save()
        
        # Add approval to data for rule evaluation
        self.data['approval_status'] = action
        
        # Continue execution
        return self.start()
    
    def process_task_completion(self, task_id: str, data: dict = None):
        """
        Process task completion.
        
        Args:
            task_id: ID of the completed task
            data: Task completion data
            
        Returns:
            dict: Result of processing
        """
        current_step = self.workflow_execution.current_step
        
        if not current_step or current_step.step_type != 'TASK':
            return {
                'success': False,
                'error': 'Current step is not a task step'
            }
        
        # Get or create step execution
        step_execution, created = StepExecution.objects.get_or_create(
            workflow_execution=self.workflow_execution,
            step=current_step,
            defaults={
                'status': 'IN_PROGRESS',
                'execution_count': 0
            }
        )
        
        # Store task completion
        result_data = {'task_completed': True}
        if data:
            result_data.update(data)
        
        step_execution.result_data = result_data
        step_execution.save()
        
        # Add task completion to data for rule evaluation
        self.data['task_completed'] = True
        
        # Continue execution
        return self.start()


def start_workflow_execution(workflow, triggered_by, data: dict = None) -> WorkflowExecution:
    """
    Start a new workflow execution.
    
    Args:
        workflow: The Workflow to execute
        triggered_by: User who triggered the execution
        data: Initial workflow data
        
    Returns:
        WorkflowExecution: The created execution
    """
    execution = WorkflowExecution.objects.create(
        workflow=workflow,
        data=data or {},
        triggered_by=triggered_by,
        status='RUNNING'
    )
    
    # Run the execution
    engine = GraphExecutionEngine(execution)
    engine.start()
    
    return execution


def resume_workflow_execution(execution_id: str) -> dict:
    """
    Resume a paused workflow execution.
    
    Args:
        execution_id: ID of the execution to resume
        
    Returns:
        dict: Result of resuming
    """
    try:
        execution = WorkflowExecution.objects.get(id=execution_id)
    except WorkflowExecution.DoesNotExist:
        return {
            'success': False,
            'error': 'Execution not found'
        }
    
    if execution.status != 'RUNNING':
        return {
            'success': False,
            'error': f'Cannot resume execution with status: {execution.status}'
        }
    
    engine = GraphExecutionEngine(execution)
    return engine.start()


def process_approval(execution_id: str, user, action: str, comment: str = "") -> dict:
    """
    Process an approval for a workflow execution.
    
    Args:
        execution_id: ID of the execution
        user: User performing the approval
        action: 'approve' or 'reject'
        comment: Optional comment
        
    Returns:
        dict: Result of processing
    """
    try:
        execution = WorkflowExecution.objects.get(id=execution_id)
    except WorkflowExecution.DoesNotExist:
        return {
            'success': False,
            'error': 'Execution not found'
        }
    
    engine = GraphExecutionEngine(execution)
    return engine.process_approval(user, action, comment)


def process_task_completion(execution_id: str, task_id: str, data: dict = None) -> dict:
    """
    Process task completion for a workflow execution.
    
    Args:
        execution_id: ID of the execution
        task_id: ID of the completed task
        data: Task completion data
        
    Returns:
        dict: Result of processing
    """
    try:
        execution = WorkflowExecution.objects.get(id=execution_id)
    except WorkflowExecution.DoesNotExist:
        return {
            'success': False,
            'error': 'Execution not found'
        }
    
    engine = GraphExecutionEngine(execution)
    return engine.process_task_completion(task_id, data)
