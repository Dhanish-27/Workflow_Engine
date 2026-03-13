import uuid
from django.db import models


class Execution(models.Model):

    STATUS_CHOICES = (
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

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    data = models.JSONField()

    current_step = models.ForeignKey(
        "steps.Step",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    retries = models.IntegerField(default=0)

    triggered_by = models.CharField(max_length=255)

    logs = models.JSONField(default=list)

    started_at = models.DateTimeField(auto_now_add=True)

    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Execution {self.id} - {self.status}"



class ExecutionLog(models.Model):

    execution = models.ForeignKey(
        Execution,
        on_delete=models.CASCADE,
        related_name="execution_logs"
    )

    step_name = models.CharField(max_length=255)

    step_type = models.CharField(max_length=50)

    evaluated_rules = models.JSONField()

    selected_next_step = models.CharField(max_length=255, null=True, blank=True)

    status = models.CharField(max_length=50)

    approver_id = models.CharField(max_length=255, null=True, blank=True)

    error_message = models.TextField(null=True, blank=True)

    started_at = models.DateTimeField()

    ended_at = models.DateTimeField()

    def __str__(self):
        return f"{self.step_name} - {self.status}"