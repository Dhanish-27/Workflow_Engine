from rest_framework import serializers
from .models import Step


class StepSerializer(serializers.ModelSerializer):
    
    # Include workflow name for display
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    # Explicitly return IDs as strings for visual builder
    id = serializers.SerializerMethodField()
    
    class Meta:
        model = Step
        fields = [
            'id', 'workflow', 'workflow_name', 'name', 'step_type', 
            'approval_type', 'assigned_to', 'order', 'metadata',
            'created_at', 'updated_at'
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
