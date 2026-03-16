from rest_framework import serializers
from .models import Execution, ExecutionLog, StepApproval


class ExecutionLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExecutionLog
        fields = "__all__"


class ExecutionSerializer(serializers.ModelSerializer):

    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    current_step_name = serializers.CharField(source='current_step.name', read_only=True)
    created_at = serializers.DateTimeField(source='started_at', read_only=True)
    triggered_by_name = serializers.SerializerMethodField()
    triggered_by_email = serializers.SerializerMethodField()
    logs = ExecutionLogSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    pending_approval_role = serializers.SerializerMethodField()

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
            "current_step_name",
            "pending_approval_from",
            "retries",
            "triggered_by",
            "triggered_by_name",
            "triggered_by_email",
            "started_at",
            "created_at",
            "ended_at",
            "logs",
            "timeline",
            "status_display",
            "pending_approval_role",
        ]
        read_only_fields = [
            "id",
            "workflow_version",
            "status",
            "retries",
            "started_at",
            "created_at",
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

    def get_timeline(self, obj):
        """Format logs into a timeline format the frontend expects"""
        timeline = []
        logs = obj.logs.all().order_by('started_at')
        
        for log in logs:
            timeline.append({
                "step_name": log.step_name,
                "status": log.status,
                "completed_at": log.ended_at,
                "approver_role": log.approver_role,
            })
            
        # If execution is in progress, add the current step as 'current'
        if obj.status in ['in_progress', 'pending'] and obj.current_step:
            timeline.append({
                "step_name": obj.current_step.name,
                "status": "current",
                "completed_at": None,
                "approver_role": obj.pending_approval_from,
            })
            
        return timeline

    def get_status_display(self, obj):
        """Returns a detailed human-readable status"""
        if obj.status == 'completed':
            return "Workflow Completed"
        if obj.status == 'failed':
            return "Workflow Failed"
        if obj.status == 'canceled':
            return "Workflow Canceled"
            
        if obj.status == 'pending' and obj.current_step:
            role = obj.get_pending_approval_from_display() or obj.pending_approval_from
            return f"Current step - {obj.current_step.name} (Pending for {role} Approval)"
            
        if obj.status == 'in_progress' and obj.current_step:
            return f"Processing - {obj.current_step.name}"
            
        return obj.get_status_display()

    def get_pending_approval_role(self, obj):
        """Returns the role name that needs to approve"""
        if obj.status == 'pending':
            return obj.get_pending_approval_from_display() or obj.pending_approval_from
        return None
