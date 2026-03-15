import json
from rest_framework import serializers
from .models import Rule
from apps.steps.models import Step

class RuleSerializer(serializers.ModelSerializer):
    
    # Add readable field for next_step name
    next_step_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    
    # Make step and next_step writable PrimaryKeyRelatedFields
    step = serializers.PrimaryKeyRelatedField(queryset=Step.objects.all())
    next_step = serializers.PrimaryKeyRelatedField(queryset=Step.objects.all(), allow_null=True, required=False)
    
    class Meta:
        model = Rule
        fields = [
            'id', 'name', 'step', 'step_name', 'condition', 
            'next_step', 'next_step_name', 'priority', 
            'is_default', 'created_at', 'updated_at'
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
        Validate and parse the condition field.
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
    
    def create(self, validated_data):
        """
        Create a new rule with auto-generated name if not provided.
        """
        name = validated_data.get('name')
        step = validated_data.get('step')
        
        if not name:
            count = Rule.objects.filter(step=step).count() + 1
            validated_data['name'] = f"Rule {count}"
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update an existing rule.
        """
        return super().update(instance, validated_data)
