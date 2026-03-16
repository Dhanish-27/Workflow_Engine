from django.contrib import admin
from .models import Rule, RuleCondition


class RuleConditionInline(admin.TabularInline):
    """Inline admin for RuleCondition"""
    model = RuleCondition
    extra = 1
    fields = ['field_name', 'operator', 'value', 'order']


@admin.register(Rule)
class RuleAdmin(admin.ModelAdmin):
    """Admin for Rule model"""
    
    list_display = (
        "id",
        "name",
        "step",
        "logical_operator",
        "next_step",
        "priority",
        "is_default"
    )
    
    list_filter = ("step", "logical_operator", "is_default")
    
    search_fields = ("name", "step__name")
    
    ordering = ("priority",)
    
    inlines = [RuleConditionInline]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'step', 'logical_operator', 'priority', 'is_default')
        }),
        ('Transition', {
            'fields': ('next_step',)
        }),
        ('Legacy Conditions', {
            'fields': ('condition',),
            'classes': ('collapse',)
        }),
    )


@admin.register(RuleCondition)
class RuleConditionAdmin(admin.ModelAdmin):
    """Admin for RuleCondition model"""
    
    list_display = (
        "id",
        "rule",
        "field_name",
        "operator",
        "value",
        "order"
    )
    
    list_filter = ("operator", "rule__step")
    
    search_fields = ("field_name", "rule__name", "rule__step__name")
    
    ordering = ("rule", "order")
    
    raw_id_fields = ("rule",)
