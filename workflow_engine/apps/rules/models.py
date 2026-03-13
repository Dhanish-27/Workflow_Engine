import uuid
from django.db import models


class Rule(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow = models.ForeignKey(
        "workflows.Workflow",
        on_delete=models.CASCADE,
        related_name="rules"
    )

    name = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    # dynamic condition structure
    conditions = models.JSONField()

    # dynamic action structure
    actions = models.JSONField()

    priority = models.IntegerField(default=1)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority"]

    def __str__(self):
        return self.name