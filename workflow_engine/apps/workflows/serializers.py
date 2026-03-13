from rest_framework import serializers
from .models import Workflow, WorkflowField


class WorkflowFieldSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkflowField
        fields = "__all__"


class WorkflowSerializer(serializers.ModelSerializer):

    fields = WorkflowFieldSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = "__all__"