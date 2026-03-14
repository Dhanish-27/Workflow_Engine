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

    retries = models.IntegerField(default=0)

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
