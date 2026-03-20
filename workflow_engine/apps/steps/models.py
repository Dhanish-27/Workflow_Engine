import uuid
from django.db import models


class TaskDefinition(models.Model):
    """
    TaskDefinition model for defining task templates.
    Supports fields that can verify existing information (verify_existing = true)
    and fields that request new information (is_new_field = true).
    """
    TASK_TYPES = (
        ("generic", "Generic Task"),
        ("document_upload", "Upload a new document"),
        ("verify_data", "Verify existing details"),
        ("edit_data", "Edit requested field data"),
        ("request_info", "Requesting Information"),
    )

    FIELD_TYPES = (
        ("text", "Text"),
        ("number", "Number"),
        ("dropdown", "Dropdown"),
        ("date", "Date"),
        ("boolean", "Boolean"),
        ("file_upload", "File Upload"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    task_type = models.CharField(max_length=30, choices=TASK_TYPES, default="generic")
    
    # Individual field properties
    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPES,
        blank=True,
        default=""
    )
    field_name = models.CharField(max_length=100, blank=True, default="")
    is_required = models.BooleanField(default=False)
    is_verify_field = models.BooleanField(
        default=False,
        help_text="If true, this field verifies existing data"
    )
    is_new_field = models.BooleanField(
        default=False,
        help_text="If true, this requests new data"
    )
    options = models.JSONField(
        null=True,
        blank=True,
        help_text="Options for dropdown fields"
    )
    field_description = models.TextField(
        blank=True,
        default="",
        help_text="Help text for the field"
    )
    order = models.IntegerField(
        default=0,
        help_text="Order of the field"
    )
    
    # JSON field for storing array of field definitions
    form_fields = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


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

    description = models.TextField(blank=True, default="")

    step_type = models.CharField(
        max_length=20,
        choices=STEP_TYPES
    )

    # Link to a pre-defined task template
    task_definition = models.ForeignKey(
        TaskDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="steps"
    )

    # Simple task template selection (document_upload, verify_data, edit_data)
    task_template = models.CharField(
        max_length=30,
        choices=(
            ("document_upload", "Upload a new document"),
            ("verify_data", "Verify existing details"),
            ("edit_data", "Edit requested field data"),
        ),
        blank=True,
        default="",
        help_text="Template type for auto-assigned tasks"
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

    # Role required to complete this task step
    assigned_role = models.CharField(
        max_length=20,
        choices=(
            ("employee", "Employee"),
            ("manager", "Manager"),
            ("finance", "Finance"),
            ("ceo", "CEO"),
            ("admin", "Admin"),
        ),
        blank=True,
        null=True,
    )

    is_start_step = models.BooleanField(
        default=False,
        help_text="If true, this is the starting step of the workflow"
    )
    
    is_end_step = models.BooleanField(
        default=False,
        help_text="If true, this is an ending step of the workflow"
    )

    metadata = models.JSONField(default=dict)

    form_fields = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def required_role(self):
        """Returns the role required to approve this step"""
        if self.step_type != "approval":
            return None
        return self.approval_type
