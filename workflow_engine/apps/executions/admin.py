from django.contrib import admin
from .models import Execution, ExecutionLog


@admin.register(Execution)
class ExecutionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "workflow",
        "status",
        "workflow_version",
        "started_at",
        "ended_at"
    )

    list_filter = ("status", "workflow")


@admin.register(ExecutionLog)
class ExecutionLogAdmin(admin.ModelAdmin):

    list_display = (
        "execution",
        "step_name",
        "status",
        "started_at",
        "ended_at"
    )