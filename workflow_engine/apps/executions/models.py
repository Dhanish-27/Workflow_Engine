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

    retries = models.IntegerField(default=0)

    triggered_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True
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

    evaluated_rules = models.JSONField()

    selected_next_step = models.CharField(max_length=255, null=True)

    status = models.CharField(max_length=50)

    approver_id = models.UUIDField(null=True)

    error_message = models.TextField(null=True)

    started_at = models.DateTimeField()

    ended_at = models.DateTimeField()