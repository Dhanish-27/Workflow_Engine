import json
from rest_framework import serializers
from .models import Rule


class RuleSerializer(serializers.ModelSerializer):
    
    # Add readable field for next_step name
    next_step_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    
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
        return obj.step.name
    
    def validate_condition(self, value):
        """
        Validate and parse the condition field.
        Accepts either:
        - JSON string with structured conditions
        - Dict with structured conditions
        """
        if not value:
            return json.dumps({"conditions": [], "logical_operator": "AND"})
        
        # If it's already a dict, convert to JSON
        if isinstance(value, dict):
            # Validate the structure
            conditions = value.get("conditions", [])
            logical_operator = value.get("logical_operator", "AND")
            
            # Validate each condition
            for cond in conditions:
                if not isinstance(cond, dict):
                    raise serializers.ValidationError("Each condition must be a dictionary")
                
                if not cond.get("field"):
                    raise serializers.ValidationError("Each condition must have a 'field'")
                
                if not cond.get("operator"):
                    raise serializers.ValidationError("Each condition must have an 'operator'")
            
            # Validate logical operator
            if logical_operator not in ["AND", "OR"]:
                raise serializers.ValidationError("Logical operator must be 'AND' or 'OR'")
            
            return json.dumps(value)
        
        # If it's a string, try to parse and validate
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                
                # Validate the structure
                conditions = parsed.get("conditions", [])
                logical_operator = parsed.get("logical_operator", "AND")
                
                # Validate each condition
                for cond in conditions:
                    if not isinstance(cond, dict):
                        raise serializers.ValidationError("Each condition must be a dictionary")
                    
                    if not cond.get("field"):
                        raise serializers.ValidationError("Each condition must have a 'field'")
                    
                    if not cond.get("operator"):
                        raise serializers.ValidationError("Each condition must have an 'operator'")
                
                # Validate logical operator
                if logical_operator not in ["AND", "OR"]:
                    raise serializers.ValidationError("Logical operator must be 'AND' or 'OR'")
                
                return value
            except json.JSONDecodeError:
                # If it's not valid JSON, wrap it as a simple condition
                # This is for backward compatibility with old plain text conditions
                return json.dumps({
                    "conditions": [{"field": value, "operator": "contains", "value": ""}],
                    "logical_operator": "AND"
                })
        
        raise serializers.ValidationError("Condition must be a valid JSON string or object")
    
    def validate(self, attrs):
        """
        Validate the entire rule.
        """
        is_default = attrs.get('is_default', False)
        next_step = attrs.get('next_step')
        condition = attrs.get('condition')
        
        # Validate default rule constraints
        if is_default:
            # Default rules should not have conditions (conditions array should be empty)
            if condition:
                try:
                    parsed = json.loads(condition) if isinstance(condition, str) else condition
                    conditions = parsed.get("conditions", [])
                    if conditions:
                        raise serializers.ValidationError({
                            'condition': 'Default rule cannot have conditions'
                        })
                except:
                    pass
            
            # Default rules don't need a next_step
            # But if there's no next_step, the workflow will end
        else:
            # Non-default rules must have a next_step
            if not next_step:
                raise serializers.ValidationError({
                    'next_step': 'Next step is required for non-default rules'
                })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create a new rule with auto-generated name if not provided.
        """
        name = validated_data.get('name')
        step = validated_data.get('step')
        
        if not name:
            # Count existing rules for this step
            count = Rule.objects.filter(step=step).count() + 1
            validated_data['name'] = f"Rule {count}"
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update an existing rule.
        """
        return super().update(instance, validated_data)
