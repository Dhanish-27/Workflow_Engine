from django.utils import timezone
from apps.rules.models import Rule
from apps.executions.models import ExecutionLog
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
    
    for rule in rules:
        # Default rules always match - use as fallback
        if rule.is_default:
            return rule.next_step, results
        
        # Use the safe evaluate method from rules/models.py
        matches = rule.evaluate(data)
        results.append({"rule_id": str(rule.id), "result": matches})
        
        if matches:
            return rule.next_step, results
    
    # No rules matched - return None
    return None, results


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
            execution.status = "completed"
            execution.pending_approval_from = None
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
        
        # If it's an approval step, we stop here and wait for user input
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
            
        # For non-approval steps (task, notification), evaluate rules and move to next
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
        
        # Update execution state
        execution.current_step = next_step
        
        # If no next step, we are done
        if not next_step:
            execution.status = "completed"
            execution.pending_approval_from = None
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
