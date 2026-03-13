import uuid
from django.db import models


class Rule(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    step = models.ForeignKey(
        "steps.Step",
        on_delete=models.CASCADE,
        related_name="rules"
    )

    condition = models.TextField()

    next_step = models.ForeignKey(
        "steps.Step",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_rules"
    )

    priority = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority"]

    def __str__(self):
        return self.condition