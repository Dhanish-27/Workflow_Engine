import uuid
from django.db import models


class Step(models.Model):

    STEP_TYPES = (
        ("task", "Task"),
        ("approval", "Approval"),
        ("notification", "Notification"),
    )

    # Approval types for different roles
    APPROVAL_TYPES = (
        ("general", "General Approval"),
        ("manager_approval", "Manager Approval"),
        ("finance_approval", "Finance Approval"),
        ("ceo_approval", "CEO Approval"),
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

    # Approval type determines which role can approve this step
    approval_type = models.CharField(
        max_length=30,
        choices=APPROVAL_TYPES,
        default="general",
        blank=True
    )

    # Optional: Assign specific approver by user ID
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_steps"
    )

    order = models.IntegerField()

    metadata = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name

    @property
    def required_role(self):
        """Returns the role required to approve this step"""
        if self.step_type != "approval":
            return None
        return self.approval_type
