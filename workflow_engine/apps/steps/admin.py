from django.contrib import admin
from .models import Step


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "workflow",
        "step_type",
        "order",
        "created_at"
    )

    list_filter = ("step_type", "workflow")

    ordering = ("order",)