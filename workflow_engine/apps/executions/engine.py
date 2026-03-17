from django.utils import timezone
from django.db.models import Q
from apps.rules.models import Rule
from apps.executions.models import ExecutionLog, Task
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


def get_next_step(step, data):
    """
    Get the next step based on rule evaluation.
    
    Args:
        step: Step object with related rules
        data: Dict of field values to evaluate rules against
        
    Returns:
        tuple: (next_step, evaluated_rules) where:
            - next_step: The next Step object to transition to, or None
            - evaluated_rules: List of dicts with rule_id and result
    """
    if not step:
        return None, []

    rules = step.rules.all().order_by("priority")
    
    results = []
    default_rule = None
    
    for rule in rules:
        if rule.is_default:
            default_rule = rule
            continue
            
        # Use the new evaluate_conditions method from rules/models.py
        # This properly handles RuleCondition model objects and legacy JSON conditions
        matches = rule.evaluate_conditions(data)
        results.append({"rule_id": str(rule.id), "result": matches})
        
        if matches:
            return rule.next_step, results
    
    # If no rules matched, use default rule if it exists
    if default_rule:
        return default_rule.next_step, results
        
    # No rules matched and no default rule - fall back to sequential execution
    # Get the next step in the workflow based on the 'order' field
    next_step = step.workflow.steps.filter(order__gt=step.order).first()
    
    return next_step, results


def process_execution(execution):
    """
    Process the execution: move through task steps automatically until 
    an approval step or the end is reached.
    
    Args:
        execution: Execution instance to process
    """
    # If no current step, try to initialize from workflow start step
    if not execution.current_step:
        if execution.status == "in_progress":
            start_step = execution.workflow.start_step
            # Fallback if start_step is not explicitly set
            if not start_step:
                start_step = execution.workflow.steps.order_by('order').first()
            
            if not start_step:
                # If still no step, we can't proceed
                return
            
            execution.current_step = start_step
            execution.save()
        elif execution.status == "pending":
            # If status is pending but no current step, it means we probably just approved the last step
            # Also check if we completed a task step
            execution.status = "completed"
            execution.pending_approval_from = None
            execution.pending_task_from = None
            execution.save()
            
            # Send completion notifications
            try:
                notify_completed(execution)
                send_completed_email(execution)
            except Exception:
                pass
            return

    while execution.current_step:
        current_step = execution.current_step
        
        # Clear pending fields when starting a new step to ensure a clean slate
        # These will be set if the step pauses (approval or task)
        execution.pending_approval_from = None
        execution.pending_task_from = None
        if current_step.step_type == "approval":
            # Map approval_type to pending_approval_from
            approval_type_map = {
                "manager_approval": "manager",
                "finance_approval": "finance",
                "ceo_approval": "ceo",
                "general": "general"
            }
            execution.status = "pending"
            execution.pending_approval_from = approval_type_map.get(current_step.approval_type, "general")
            execution.save()
            
            # Send notifications
            try:
                notify_approval_required(execution)
                send_approval_required_email(execution)
            except Exception:
                pass
            return
        
        # If it's a task step, create tasks for users with the matching role
        if current_step.step_type == "task":
            # Check if tasks already exist for this execution step
            existing_tasks = Task.objects.filter(
                execution=execution,
                step=current_step
            )
            
            if existing_tasks.exists():
                # Tasks already exist, check if all are completed
                pending_tasks = existing_tasks.filter(status="pending")
                if pending_tasks.exists():
                    # Still have pending tasks, execution stays paused
                    execution.status = "pending"
                    execution.pending_task_from = current_step.assigned_role
                    execution.save()
                    return
                # All tasks completed, continue to next step
            else:
                # Create new tasks for users with the assigned role or specific user
                assigned_role = current_step.assigned_role
                assigned_user = current_step.assigned_to

                if assigned_user:
                    # Create a single task for the specific user
                    task_title = current_step.name
                    task_description = current_step.description
                    task_form_fields = current_step.form_fields

                    # If step has a task definition, use its properties
                    task_type = current_step.task_template or "generic"
                    verify_fields = []
                    original_data = None
                    
                    if current_step.task_definition:
                        task_title = current_step.task_definition.name
                        task_description = current_step.task_definition.description
                        task_form_fields = current_step.task_definition.form_fields
                        # task_template takes precedence over task_definition.task_type
                        if not current_step.task_template:
                            task_type = current_step.task_definition.task_type
                        
                        # Extract verify_fields and new_field from form_fields
                        if task_form_fields:
                            for field in task_form_fields:
                                if isinstance(field, dict):
                                    if field.get('is_verify_field'):
                                        field_name = field.get('field_name') or field.get('name') or field.get('key')
                                        if field_name:
                                            verify_fields.append(field_name)
                    
                    # Copy execution data for verification purposes
                    original_data = execution.data.copy() if execution.data else {}

                    Task.objects.create(
                        execution=execution,
                        step=current_step,
                        assigned_to=assigned_user,
                        title=task_title,
                        description=task_description,
                        form_fields=task_form_fields,
                        task_type=task_type,
                        verify_fields=verify_fields,
                        original_data=original_data,
                        status="pending"
                    )
                    
                    # Pause execution and wait for task completion
                    execution.status = "pending"
                    execution.pending_task_from = f"User: {assigned_user.username}"
                    execution.save()
                    
                    # Log the task creation
                    ExecutionLog.objects.create(
                        execution=execution,
                        step_name=current_step.name,
                        step_type=current_step.step_type,
                        evaluated_rules=[],
                        selected_next_step=None,
                        status="pending",
                        started_at=timezone.now(),
                        ended_at=timezone.now()
                    )
                    return
                elif not assigned_role:
                    # Auto-assign to execution.triggered_by (the request creator) if no assigned_to or assigned_role
                    triggered_by = execution.triggered_by
                    
                    if triggered_by:
                        task_title = current_step.name
                        task_description = current_step.description
                        task_form_fields = current_step.form_fields

                        # If step has a task template, use it to determine task type
                        task_type = current_step.task_template or "generic"
                        verify_fields = []
                        original_data = None
                        
                        if current_step.task_definition:
                            task_title = current_step.task_definition.name
                            task_description = current_step.task_definition.description
                            task_form_fields = current_step.task_definition.form_fields
                            # task_template takes precedence over task_definition.task_type
                            if not current_step.task_template:
                                task_type = current_step.task_definition.task_type
                            
                            # Extract verify_fields and new_field from form_fields
                            if task_form_fields:
                                for field in task_form_fields:
                                    if isinstance(field, dict):
                                        if field.get('is_verify_field'):
                                            field_name = field.get('field_name') or field.get('name') or field.get('key')
                                            if field_name:
                                                verify_fields.append(field_name)
                        
                        # Copy execution data for verification purposes
                        original_data = execution.data.copy() if execution.data else {}

                        Task.objects.create(
                            execution=execution,
                            step=current_step,
                            assigned_to=triggered_by,
                            title=task_title,
                            description=task_description,
                            form_fields=task_form_fields,
                            task_type=task_type,
                            verify_fields=verify_fields,
                            original_data=original_data,
                            status="pending"
                        )
                        
                        # Pause execution and wait for task completion
                        execution.status = "pending"
                        execution.pending_task_from = f"User: {triggered_by.username}"
                        execution.save()
                        
                        # Log the task creation
                        ExecutionLog.objects.create(
                            execution=execution,
                            step_name=current_step.name,
                            step_type=current_step.step_type,
                            evaluated_rules=[],
                            selected_next_step=None,
                            status="pending",
                            started_at=timezone.now(),
                            ended_at=timezone.now()
                        )
                        return
                    else:
                        logger.warning(f"Task step {current_step.name} has no assigned_role, assigned_to, or triggered_by")
                        # Still evaluate rules and move to next step if no user is available
                        next_step, evaluated_rules = get_next_step(current_step, execution.data)
                else:
                    # Get users with the matching role
                    users_with_role = User.objects.filter(role=assigned_role)
                    
                    if not users_with_role.exists():
                        logger.warning(f"No users found with role '{assigned_role}' for task step {current_step.name}")
                        # Evaluate rules and move to next step even if no users found
                        next_step, evaluated_rules = get_next_step(current_step, execution.data)
                    else:
                        task_title = current_step.name
                        task_description = current_step.description
                        task_form_fields = current_step.form_fields

                        task_type = current_step.task_template or "generic"
                        verify_fields = []
                        original_data = None
                        
                        if current_step.task_definition:
                            task_title = current_step.task_definition.name
                            task_description = current_step.task_definition.description
                            task_form_fields = current_step.task_definition.form_fields
                            # task_template takes precedence over task_definition.task_type
                            if not current_step.task_template:
                                task_type = current_step.task_definition.task_type
                            
                            # Extract verify_fields and new_field from form_fields
                            if task_form_fields:
                                for field in task_form_fields:
                                    if isinstance(field, dict):
                                        if field.get('is_verify_field'):
                                            field_name = field.get('field_name') or field.get('name') or field.get('key')
                                            if field_name:
                                                verify_fields.append(field_name)
                        
                        # Copy execution data for verification purposes
                        original_data = execution.data.copy() if execution.data else {}

                        # Create tasks for each user with the matching role
                        for user in users_with_role:
                            Task.objects.create(
                                execution=execution,
                                step=current_step,
                                assigned_to=user,
                                title=task_title,
                                description=task_description,
                                form_fields=task_form_fields,
                                task_type=task_type,
                                verify_fields=verify_fields,
                                original_data=original_data,
                                status="pending"
                            )
                        
                        # Pause execution and wait for task completion
                        execution.status = "pending"
                        execution.pending_task_from = assigned_role
                        execution.save()
                        
                        # Log the task creation
                        ExecutionLog.objects.create(
                            execution=execution,
                            step_name=current_step.name,
                            step_type=current_step.step_type,
                            evaluated_rules=[],
                            selected_next_step=None,
                            status="pending",
                            started_at=timezone.now(),
                            ended_at=timezone.now()
                        )
                        return
            # If we get here, either tasks existed but are completed, or no role was assigned
            # Evaluate rules and move to next step
            next_step, evaluated_rules = get_next_step(current_step, execution.data)
        else:
            # For non-approval, non-task steps (notification), evaluate rules and move to next
            next_step, evaluated_rules = get_next_step(current_step, execution.data)
        
        # Log the automated transition
        ExecutionLog.objects.create(
            execution=execution,
            step_name=current_step.name,
            step_type=current_step.step_type,
            evaluated_rules=evaluated_rules,
            selected_next_step=str(next_step) if next_step else None,
            status="completed",
            started_at=timezone.now(),
            ended_at=timezone.now()
        )
        
        # Clear pending fields when moving to next step
        execution.pending_approval_from = None
        execution.pending_task_from = None
        execution.current_step = next_step
        
        # If no next step, we are done
        if not next_step:
            execution.status = "completed"
            execution.pending_approval_from = None
            execution.pending_task_from = None
            execution.save()
            
            # Send completion notifications
            try:
                notify_completed(execution)
                send_completed_email(execution)
            except Exception:
                pass
            return
            
        # Save progress and continue the loop
        execution.save()
