import logging
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

logger = logging.getLogger(__name__)

# Default from email if not configured in settings
DEFAULT_FROM_EMAIL = "noreply@workflow.com"


def get_from_email():
    """Get the default from email address."""
    return getattr(settings, 'DEFAULT_FROM_EMAIL', DEFAULT_FROM_EMAIL)


def send_workflow_email(user, subject, message):
    """
    Send email to a user.
    
    Parameters:
        user: User instance
        subject: str - email subject
        message: str - email body
        
    Returns:
        bool - True if email was sent successfully, False otherwise
    """
    if not user or not user.email:
        logger.warning(f"Cannot send email: user or user.email is None")
        return False
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=get_from_email(),
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Error sending email to {user.email}: {e}")
        return False


def send_approval_required_email(execution):
    """
    Email approvers that approval is needed.
    
    Parameters:
        execution: Execution instance
        
    Returns:
        int - Number of emails sent successfully
    """
    sent_count = 0
    
    try:
        if not execution.pending_approval_from:
            return sent_count
            
        # Find users with roles matching execution.pending_approval_from
        approvers = User.objects.filter(role=execution.pending_approval_from)
        
        if not approvers.exists():
            logger.warning(f"No approvers found for role: {execution.pending_approval_from}")
            return sent_count
        
        # Get workflow name and triggered by user
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        triggered_by_username = execution.triggered_by.username if execution.triggered_by else "Unknown User"
        execution_id = str(execution.id)
        
        subject = f"Approval Required - {workflow_name}"
        
        # Build approval link (this would be configured based on the frontend URL)
        approval_link = f"/approvals/{execution_id}"
        
        message = f"""Hello,

An approval is required for a workflow execution.

Execution ID: {execution_id}
Workflow: {workflow_name}
Triggered by: {triggered_by_username}

Please click the link below to review and approve/reject:
{approval_link}

Thank you."""
        
        for approver in approvers:
            if send_workflow_email(approver, subject, message):
                sent_count += 1
                
    except Exception as e:
        logger.error(f"Error sending approval required email: {e}")
        
    return sent_count


def send_approved_email(execution, approver):
    """
    Email requester that request was approved.
    
    Parameters:
        execution: Execution instance
        approver: User instance who approved
        
    Returns:
        bool - True if email was sent successfully, False otherwise
    """
    try:
        if not execution.triggered_by:
            logger.warning("Cannot send approved email: execution.triggered_by is None")
            return False
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        # Get step name from current_step
        step_name = execution.current_step.name if execution.current_step else "Unknown Step"
        
        # Get approver name
        approver_name = approver.username if approver else "Unknown Approver"
        
        subject = f"Request Approved - {workflow_name}"
        
        message = f"""Hello {execution.triggered_by.username},

Your request has been approved!

Workflow: {workflow_name}
Step: {step_name}
Approved by: {approver_name}

The workflow will continue to the next step.

Thank you."""
        
        return send_workflow_email(execution.triggered_by, subject, message)
        
    except Exception as e:
        logger.error(f"Error sending approved email: {e}")
        return False


def send_rejected_email(execution, approver, reason=None):
    """
    Email requester that request was rejected.
    
    Parameters:
        execution: Execution instance
        approver: User instance who rejected
        reason: str - optional rejection reason/comment
        
    Returns:
        bool - True if email was sent successfully, False otherwise
    """
    try:
        if not execution.triggered_by:
            logger.warning("Cannot send rejected email: execution.triggered_by is None")
            return False
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        # Get step name from current_step
        step_name = execution.current_step.name if execution.current_step else "Unknown Step"
        
        # Get approver name
        approver_name = approver.username if approver else "Unknown Approver"
        
        subject = f"Request Rejected - {workflow_name}"
        
        message = f"""Hello {execution.triggered_by.username},

Your request has been rejected.

Workflow: {workflow_name}
Step: {step_name}
Rejected by: {approver_name}
"""
        
        if reason:
            message += f"""
Reason: {reason}
"""
        
        message += """
Please contact the approver for more information.

Thank you."""
        
        return send_workflow_email(execution.triggered_by, subject, message)
        
    except Exception as e:
        logger.error(f"Error sending rejected email: {e}")
        return False


def send_completed_email(execution):
    """
    Email requester that workflow completed.
    
    Parameters:
        execution: Execution instance
        
    Returns:
        bool - True if email was sent successfully, False otherwise
    """
    try:
        if not execution.triggered_by:
            logger.warning("Cannot send completed email: execution.triggered_by is None")
            return False
            
        # Get workflow name
        workflow_name = execution.workflow.name if execution.workflow else "Unknown Workflow"
        
        subject = f"Workflow Completed - {workflow_name}"
        
        message = f"""Hello {execution.triggered_by.username},

Your workflow '{workflow_name}' has been completed successfully.

Execution ID: {execution.id}

Thank you for using our workflow system."""
        
        return send_workflow_email(execution.triggered_by, subject, message)
        
    except Exception as e:
        logger.error(f"Error sending completed email: {e}")
        return False
