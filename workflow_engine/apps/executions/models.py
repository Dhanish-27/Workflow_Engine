import uuid
from django.db import models


class Execution(models.Model):

    STATUS = (
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("canceled", "Canceled"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow = models.ForeignKey(
        "workflows.Workflow",
        on_delete=models.CASCADE
    )

    workflow_version = models.IntegerField()

    status = models.CharField(max_length=20, choices=STATUS)

    data = models.JSONField()

    current_step = models.ForeignKey(
        "steps.Step",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    # Track which role needs to approve the current step
    pending_approval_from = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        choices=(
            ("manager", "Manager"),
            ("finance", "Finance"),
            ("ceo", "CEO"),
            ("general", "General"),
        )
    )

    # Track which role needs to complete the current task step
    pending_task_from = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        choices=(
            ("employee", "Employee"),
            ("manager", "Manager"),
            ("finance", "Finance"),
            ("ceo", "CEO"),
            ("admin", "Admin"),
        )
    )

    retries = models.IntegerField(default=0)

    # Track task cycle count for request_change functionality (max 5 cycles)
    task_cycle_count = models.IntegerField(default=0)
    
    # Track the step to return to after requester completes a task
    original_step_for_task = models.ForeignKey(
        "steps.Step",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="execution_original_step"
    )

    triggered_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="triggered_executions"
    )

    started_at = models.DateTimeField(auto_now_add=True)

    ended_at = models.DateTimeField(null=True, blank=True)


class ExecutionLog(models.Model):

    execution = models.ForeignKey(
        Execution,
        related_name="logs",
        on_delete=models.CASCADE
    )

    step_name = models.CharField(max_length=255)

    step_type = models.CharField(max_length=50)

    # Track which approval type this was
    approval_type = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        choices=(
            ("general", "General"),
            ("manager_approval", "Manager Approval"),
            ("finance_approval", "Finance Approval"),
            ("ceo_approval", "CEO Approval"),
        )
    )

    evaluated_rules = models.JSONField()

    selected_next_step = models.CharField(max_length=255, null=True)

    status = models.CharField(max_length=50)

    approver_id = models.UUIDField(null=True)
    
    # Track approver role
    approver_role = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=(
            ("employee", "Employee"),
            ("manager", "Manager"),
            ("finance", "Finance"),
            ("ceo", "CEO"),
            ("admin", "Admin"),
        )
    )

    error_message = models.TextField(null=True)

    started_at = models.DateTimeField()

    ended_at = models.DateTimeField()


class StepApproval(models.Model):
    """Tracks approvals for approval steps in workflow executions"""
    
    ACTION_CHOICES = (
        ("approve", "Approve"),  # Accept - move to next step
        ("reject", "Reject"),    # Fail the workflow
        ("request_change", "Request Change"),  # Assign task to requester
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    execution = models.ForeignKey(
        Execution,
        on_delete=models.CASCADE,
        related_name="approvals"
    )
    
    step = models.ForeignKey(
        "steps.Step",
        on_delete=models.SET_NULL,
        null=True,
        related_name="approvals"
    )
    
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="approvals"
    )
    
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    comment = models.TextField(blank=True, default="")
    
    # Store details for request_change action (e.g., what documents to submit, amount reduction, etc.)
    change_request_details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Details for request_change action: {task_type, description, form_fields}"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.action} by {self.approved_by} on {self.step}"


class Task(models.Model):
    """
    Tracks individual tasks within a workflow execution.
    Supports verification fields (to show original data) and new request fields
    (to request new data).
    """

    STATUS = (
        ("pending", "Pending"),
        ("completed", "Completed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    execution = models.ForeignKey(
        Execution,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True
    )

    step = models.ForeignKey(
        "steps.Step",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )

    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    form_fields = models.JSONField(default=list, blank=True)
    
    # JSONField to store list of field names that need verification
    verify_fields = models.JSONField(
        default=list,
        blank=True,
        help_text="List of field names that need verification"
    )
    
    # JSONField to store the original data to verify against (copied from execution at task creation)
    original_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Original data to verify against, copied from execution at task creation"
    )

    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_tasks"
    )

    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    
    task_type = models.CharField(
        max_length=30,
        choices=(
            ("generic", "Generic Task"),
            ("document_upload", "Upload a new document"),
            ("verify_data", "Verify existing details"),
            ("edit_data", "Edit requested field data"),
            ("add_data", "Add new data"),
            ("request_info", "Requesting Information"),
        ),
        default="generic"
    )

    data = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Task {self.id} - {self.status}"
