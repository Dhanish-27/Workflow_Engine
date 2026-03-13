from django.contrib import admin
from .models import Rule


@admin.register(Rule)
class RuleAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "step",
        "condition",
        "next_step",
        "priority"
    )

    list_filter = ("step",)

    ordering = ("priority",)