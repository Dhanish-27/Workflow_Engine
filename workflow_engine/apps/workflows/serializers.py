from rest_framework import serializers
from .models import Workflow, WorkflowField


class WorkflowFieldSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkflowField
        fields = ['id', 'workflow', 'name', 'label', 'field_type', 'required', 'options', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']



class WorkflowSerializer(serializers.ModelSerializer):

    fields = WorkflowFieldSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = "__all__"