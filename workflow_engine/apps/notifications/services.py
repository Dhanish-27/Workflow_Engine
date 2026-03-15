from django.contrib.auth import get_user_model
from django.db import models
from django.core.exceptions import ValidationError

from .models import Notification

User = get_user_model()


def create_notification(user, title, message):
    """
    Creates a notification record.
    
    Parameters:
        user: User instance
        title: str - notification title
        message: str - notification message
        
    Returns:
        Notification object
    """
    try:
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message
        )
        return notification
    except Exception as e:
        # Log error but don't raise to prevent workflow interruptions
        print(f"Error creating notification: {e}")
        return None


def notify_approval_required(execution):
    """
    Notify approvers that approval is needed.
    
    Parameters:
        execution: Execution instance
        
    Returns:
        List of Notification objects
    """
    notifications = []
    
    try:
        if not execution.pending_approval_from:
            return notifications
            
        # Find users with roles matching execution.pending_approval_from
        approvers = User.objects.filter(role=execution.pending_approval_from)
        
        # Get workflow name and triggered by user
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        triggered_by_username = execution.triggered_by.username if execution.triggered_by else "Unknown User"
        
        title = "Approval Required"
        message = f"Execution ID: {execution.id}\nWorkflow: {workflow_name}\nTriggered by: {triggered_by_username}"
        
        for approver in approvers:
            notification = create_notification(approver, title, message)
            if notification:
                notifications.append(notification)
                
    except Exception as e:
        print(f"Error sending approval notification: {e}")
        
    return notifications


def notify_approved(execution, approver):
    """
    Notify requester that request was approved.
    
    Parameters:
        execution: Execution instance
        approver: User instance who approved
        
    Returns:
        Notification object or None
    """
    try:
        if not execution.triggered_by:
            return None
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        # Get step name from current_step or logs
        step_name = execution.current_step.name if execution.current_step else "Unknown Step"
        
        # Get approver name
        approver_name = approver.username if approver else "Unknown Approver"
        
        title = "Request Approved"
        message = f"Workflow: {workflow_name}\nStep: {step_name}\nApproved by: {approver_name}"
        
        return create_notification(execution.triggered_by, title, message)
        
    except Exception as e:
        print(f"Error sending approval notification: {e}")
        return None


def notify_rejected(execution, approver):
    """
    Notify requester that request was rejected.
    
    Parameters:
        execution: Execution instance
        approver: User instance who rejected
        
    Returns:
        Notification object or None
    """
    try:
        if not execution.triggered_by:
            return None
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        # Get step name from current_step or logs
        step_name = execution.current_step.name if execution.current_step else "Unknown Step"
        
        # Get approver name
        approver_name = approver.username if approver else "Unknown Approver"
        
        title = "Request Rejected"
        message = f"Workflow: {workflow_name}\nStep: {step_name}\nRejected by: {approver_name}"
        
        return create_notification(execution.triggered_by, title, message)
        
    except Exception as e:
        print(f"Error sending rejection notification: {e}")
        return None


def notify_completed(execution):
    """
    Notify requester that workflow completed.
    
    Parameters:
        execution: Execution instance
        
    Returns:
        Notification object or None
    """
    try:
        if not execution.triggered_by:
            return None
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        title = "Workflow Completed"
        message = f"Your workflow '{workflow_name}' has been completed successfully."
        
        return create_notification(execution.triggered_by, title, message)
        
    except Exception as e:
        print(f"Error sending completion notification: {e}")
        return None
