from django.contrib import admin
from .models import Workflow, WorkflowField


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "version",
        "is_active",
        "created_at"
    )


@admin.register(WorkflowField)
class WorkflowFieldAdmin(admin.ModelAdmin):

    list_display = (
        "workflow",
        "label",
        "field_type",
        "required",
        "order"
    )