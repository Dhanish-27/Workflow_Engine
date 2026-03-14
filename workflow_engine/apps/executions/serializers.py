from rest_framework import serializers
from .models import Execution, ExecutionLog


class ExecutionLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExecutionLog
        fields = "__all__"


class ExecutionSerializer(serializers.ModelSerializer):

    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    triggered_by_name = serializers.SerializerMethodField()
    triggered_by_email = serializers.SerializerMethodField()
    logs = ExecutionLogSerializer(many=True, read_only=True)

    class Meta:
        model = Execution
        fields = [
            "id",
            "workflow",
            "workflow_name",
            "workflow_version",
            "status",
            "data",
            "current_step",
            "pending_approval_from",
            "retries",
            "triggered_by",
            "triggered_by_name",
            "triggered_by_email",
            "started_at",
            "ended_at",
            "logs",
        ]
        read_only_fields = [
            "id",
            "workflow_version",
            "status",
            "retries",
            "started_at",
            "ended_at",
        ]

    def get_triggered_by_name(self, obj):
        if obj.triggered_by:
            full_name = obj.triggered_by.get_full_name()
            return full_name if full_name else obj.triggered_by.username
        return None

    def get_triggered_by_email(self, obj):
        if obj.triggered_by:
            return obj.triggered_by.email
        return None
