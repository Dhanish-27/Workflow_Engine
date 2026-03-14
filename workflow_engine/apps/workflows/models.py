import uuid
from django.db import models


class Workflow(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    version = models.IntegerField(default=1)

    is_active = models.BooleanField(default=True)

    start_step = models.ForeignKey(
        "steps.Step",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="start_workflow"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class WorkflowField(models.Model):

    FIELD_TYPES = (
        ("text", "Text"),
        ("number", "Number"),
        ("dropdown", "Dropdown"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow = models.ForeignKey(
        Workflow,
        related_name="fields",
        on_delete=models.CASCADE,
        db_index=True
    )

    name = models.CharField(max_length=100)

    label = models.CharField(max_length=100)

    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPES
    )

    required = models.BooleanField(default=False)

    options = models.JSONField(null=True, blank=True)

    order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.workflow.name} - {self.label}"