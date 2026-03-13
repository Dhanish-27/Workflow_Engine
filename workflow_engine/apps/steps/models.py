import uuid
from django.db import models


class Step(models.Model):

    STEP_TYPES = (
        ("task", "Task"),
        ("approval", "Approval"),
        ("notification", "Notification"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow = models.ForeignKey(
        "workflows.Workflow",
        on_delete=models.CASCADE,
        related_name="steps"
    )

    name = models.CharField(max_length=255)

    step_type = models.CharField(
        max_length=20,
        choices=STEP_TYPES
    )

    order = models.IntegerField()

    metadata = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name