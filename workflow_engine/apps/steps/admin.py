from django.contrib import admin
from .models import Step


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "workflow",
        "step_type",
        "is_start_step",
        "is_end_step",
        "created_at"
    )

    list_filter = ("step_type", "workflow", "is_start_step", "is_end_step")

    ordering = ("name",)