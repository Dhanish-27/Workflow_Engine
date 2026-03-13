import uuid
from django.db import models


class Workflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)

    version = models.IntegerField(default=1)

    is_active = models.BooleanField(default=True)

    input_schema = models.JSONField()

    start_step = models.ForeignKey(
        "steps.Step",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="start_workflows"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} v{self.version}"

    class Meta:
        unique_together = ["name", "version"]