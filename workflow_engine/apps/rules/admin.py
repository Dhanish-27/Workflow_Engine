from django.contrib import admin
from .models import Rule


@admin.register(Rule)
class RuleAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "workflow",
        "priority",
        "is_active",
        "created_at",
    )

    list_filter = (
        "workflow",
        "is_active"
    )

    search_fields = ("name",)