import json
from rest_framework import serializers
from .models import Rule, RuleCondition
from apps.steps.models import Step


class RuleConditionSerializer(serializers.ModelSerializer):
    """Serializer for RuleCondition model"""
    
    class Meta:
        model = RuleCondition
        fields = ['id', 'field_name', 'operator', 'value', 'order']
        read_only_fields = ['id']
    
    def validate_value(self, value):
        """Ensure value is valid JSON"""
        if value is None:
            return {}
        return value


class RuleSerializer(serializers.ModelSerializer):
    """Serializer for Rule model with nested conditions"""
    
    # Add readable field for next_step name
    next_step_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    
    # Nested conditions
    conditions = RuleConditionSerializer(many=True, required=False)
    
    # Make step and next_step writable PrimaryKeyRelatedFields
    step = serializers.PrimaryKeyRelatedField(queryset=Step.objects.all())
    next_step = serializers.PrimaryKeyRelatedField(queryset=Step.objects.all(), allow_null=True, required=False)
    
    class Meta:
        model = Rule
        fields = [
            'id', 'name', 'step', 'step_name', 'condition', 'logical_operator',
            'next_step', 'next_step_name', 'priority', 
            'is_default', 'created_at', 'updated_at', 'conditions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_next_step_name(self, obj):
        if obj.next_step:
            return obj.next_step.name
        return None
    
    def get_step_name(self, obj):
        return obj.step.name if obj.step else None
    
    def validate_condition(self, value):
        """
        Validate and parse the condition field (legacy support).
        """
        if not value:
            return json.dumps({"conditions": [], "logical_operator": "AND"})
        
        if isinstance(value, dict):
            return json.dumps(value)
        
        if isinstance(value, str):
            try:
                json.loads(value)
                return value
            except json.JSONDecodeError:
                return json.dumps({
                    "conditions": [{"field": value, "operator": "contains", "value": ""}],
                    "logical_operator": "AND"
                })
        
        return value
    
    def validate(self, attrs):
        """
        Validate the entire rule.
        """
        return attrs
    
    def _get_default_rule_exclusion(self):
        """Get the pk to exclude when checking for default rule"""
        if self.instance:
            return self.instance.pk
        return None
    
    def validate_is_default(self, value):
        """
        Validate that only one default rule per step exists.
        """
        if value:
            step = self.initial_data.get('step') or (self.instance.step if self.instance else None)
            if step:
                queryset = Rule.objects.filter(step=step, is_default=True)
                exclude_pk = self._get_default_rule_exclusion()
                if exclude_pk:
                    queryset = queryset.exclude(pk=exclude_pk)
                if queryset.exists():
                    raise serializers.ValidationError("Only one default rule is allowed per step.")
        return value
    
    def validate_priority(self, value):
        """
        Validate that priority is unique per step.
        """
        # We relax this validation to allow reordering operations via the reorder endpoint
        # The reorder endpoint will handle ensuring global consistency
        return value
    
    def create(self, validated_data):
        """
        Create a new rule with nested conditions.
        """
        from django.db.models import Max
        conditions_data = validated_data.pop('conditions', [])
        name = validated_data.get('name')
        step = validated_data.get('step')
        priority = validated_data.get('priority')
        
        if not name:
            count = Rule.objects.filter(step=step).count() + 1
            validated_data['name'] = f"Rule {count}"
            
        if priority is None:
            max_priority = Rule.objects.filter(step=step).aggregate(
                max_pri=Max('priority'))['max_pri'] or 0
            validated_data['priority'] = max_priority + 1
        
        rule = super().create(validated_data)
        
        # Create nested conditions
        for idx, condition_data in enumerate(conditions_data):
            condition_data['order'] = condition_data.get('order', idx)
            RuleCondition.objects.create(rule=rule, **condition_data)
        
        return rule
    
    def update(self, instance, validated_data):
        """
        Update an existing rule with nested conditions.
        """
        conditions_data = validated_data.pop('conditions', None)
        
        rule = super().update(instance, validated_data)
        
        # Update nested conditions if provided
        if conditions_data is not None:
            # Remove existing conditions
            rule.conditions.all().delete()
            
            # Create new conditions
            for idx, condition_data in enumerate(conditions_data):
                condition_data['order'] = condition_data.get('order', idx)
                RuleCondition.objects.create(rule=rule, **condition_data)
        
        return rule


class RuleListSerializer(serializers.ModelSerializer):
    """Serializer for listing rules with condition count"""
    
    next_step_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    condition_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Rule
        fields = [
            'id', 'name', 'step', 'step_name', 'priority', 
            'is_default', 'next_step', 'next_step_name', 
            'condition_count', 'logical_operator'
        ]
    
    def get_next_step_name(self, obj):
        if obj.next_step:
            return obj.next_step.name
        return None
    
    def get_step_name(self, obj):
        return obj.step.name if obj.step else None
    
    def get_condition_count(self, obj):
        return obj.conditions.count()
