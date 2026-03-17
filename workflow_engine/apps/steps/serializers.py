from rest_framework import serializers
from .models import Step, TaskDefinition


class TaskDefinitionFieldSerializer(serializers.Serializer):
    """Serializer for individual task definition form fields"""
    field_name = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True)
    key = serializers.CharField(required=False, allow_blank=True)
    field_type = serializers.CharField(required=False, allow_blank=True)
    label = serializers.CharField(required=False, allow_blank=True)
    is_required = serializers.BooleanField(required=False, default=False)
    is_verify_field = serializers.BooleanField(required=False, default=False)
    is_new_field = serializers.BooleanField(required=False, default=False)
    options = serializers.JSONField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False, default=0)


class TaskDefinitionSerializer(serializers.ModelSerializer):
    """
    Serializer for TaskDefinition that handles both individual field properties
    and form_fields array of field definitions.
    """
    form_fields = TaskDefinitionFieldSerializer(many=True, required=False)
    
    class Meta:
        model = TaskDefinition
        fields = [
            'id', 'name', 'description', 'task_type',
            # Individual field properties
            'field_type', 'field_name', 'is_required',
            'is_verify_field', 'is_new_field', 'options',
            'field_description', 'order',
            # JSON field for array of field definitions
            'form_fields',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Add form_fields from JSON if it's a list"""
        ret = super().to_representation(instance)
        
        # If form_fields is a list (JSON), ensure it's properly formatted
        if instance.form_fields and isinstance(instance.form_fields, list):
            # Keep the JSON format as is
            ret['form_fields'] = instance.form_fields
        
        return ret
    
    def to_internal_value(self, data):
        """Handle both list and dict formats for form_fields"""
        # Convert list format to internal value
        if 'form_fields' in data and isinstance(data['form_fields'], list):
            # Keep as list - it will be validated by the serializer
            pass
        return super().to_internal_value(data)


class StepSerializer(serializers.ModelSerializer):
    
    # Include workflow name for display
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    # Include task definition details for display
    task_definition_details = TaskDefinitionSerializer(source='task_definition', read_only=True)

    # Explicitly return IDs as strings for visual builder
    id = serializers.SerializerMethodField()
    
    class Meta:
        model = Step
        fields = [
            'id', 'workflow', 'workflow_name', 'name', 'step_type', 'task_definition',
            'task_definition_details', 'approval_type', 'assigned_role', 'assigned_to', 
            'task_template', 'order', 'metadata', 'form_fields', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_id(self, obj):
        """Return UUID as string for visual builder"""
        return str(obj.id)
    
    def to_representation(self, instance):
        """Add workflow UUID to representation"""
        ret = super().to_representation(instance)
        ret['workflow'] = str(instance.workflow_id)  # Convert UUID to string
        return ret
