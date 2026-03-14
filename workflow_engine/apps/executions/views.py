from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import User
from apps.workflows.models import Workflow
from apps.workflows.models import Workflow as WorkflowModel
from .models import Execution, ExecutionLog
from .serializers import ExecutionSerializer, ExecutionLogSerializer
from .permissions import (
    CanExecuteWorkflow,
    CanApproveExecution,
    CanViewAllExecutions,
    CanCancelExecution,
    CanRetryExecution,
    CanViewApprovalTasks,
)
from .engine import get_next_step


class ExecutionViewSet(viewsets.ModelViewSet):

    queryset = Execution.objects.all()
    serializer_class = ExecutionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["workflow", "status", "triggered_by"]

    def get_permissions(self):
        """Return permissions based on the action"""
        if self.action in ['create']:
            return [CanExecuteWorkflow()]
        if self.action in ['approve', 'reject']:
            return [CanApproveExecution()]
        if self.action in ['cancel', 'retry']:
            return [CanCancelExecution() if self.action == 'cancel' else CanRetryExecution()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        
        # Admin can see all executions
        if user.role == "admin":
            return Execution.objects.all()
        
        # Manager can see all executions
        if user.role == "manager":
            return Execution.objects.all()
        
        # Finance and CEO can see all executions for approval purposes
        if user.role in ["finance", "ceo"]:
            return Execution.objects.all()
        
        # Employee can only see their own executions
        return Execution.objects.filter(triggered_by=user)

    def create(self, request, *args, **kwargs):
        # Create execution - requires workflow in request data
        workflow_id = request.data.get("workflow")
        if not workflow_id:
            return Response(
                {"error": "workflow is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            workflow = Workflow.objects.get(id=workflow_id)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Determine pending approval based on first approval step
        pending_approval_from = None
        if workflow.start_step and workflow.start_step.step_type == "approval":
            approval_type = workflow.start_step.approval_type
            if approval_type == "manager_approval":
                pending_approval_from = "manager"
            elif approval_type == "finance_approval":
                pending_approval_from = "finance"
            elif approval_type == "ceo_approval":
                pending_approval_from = "ceo"
            else:
                pending_approval_from = "general"

        execution = Execution.objects.create(
            workflow=workflow,
            workflow_version=workflow.version,
            status="in_progress" if not pending_approval_from else "pending",
            data=request.data.get("data", {}),
            current_step=workflow.start_step,
            triggered_by=request.user,
            pending_approval_from=pending_approval_from
        )

        serializer = self.get_serializer(execution)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        execution = self.get_object()
        user = request.user
        
        # Check if execution is waiting for approval
        if execution.status not in ["pending", "in_progress"]:
            return Response(
                {"error": "Execution is not pending approval"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to approve
        if execution.pending_approval_from:
            if execution.pending_approval_from == "manager" and user.role != "manager":
                return Response(
                    {"error": "Only managers can approve this step"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif execution.pending_approval_from == "finance" and user.role != "finance":
                return Response(
                    {"error": "Only finance can approve this step"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif execution.pending_approval_from == "ceo" and user.role != "ceo":
                return Response(
                    {"error": "Only CEO can approve this step"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Get the next step using the workflow engine
        current_step = execution.current_step
        next_step = None
        evaluated_rules = {}
        
        if current_step:
            next_step, evaluated_rules = get_next_step(current_step, execution.data)
        
        # Determine next approval role for next step
        next_approval_from = None
        if next_step and next_step.step_type == "approval":
            approval_type = next_step.approval_type
            if approval_type == "manager_approval":
                next_approval_from = "manager"
            elif approval_type == "finance_approval":
                next_approval_from = "finance"
            elif approval_type == "ceo_approval":
                next_approval_from = "ceo"
            else:
                next_approval_from = "general"
        
        # Update execution with next step or mark as completed
        if next_step:
            execution.current_step = next_step
            execution.status = "pending" if next_approval_from else "in_progress"
            execution.pending_approval_from = next_approval_from
        else:
            # No more steps - mark as completed
            execution.status = "completed"
            execution.pending_approval_from = None
        
        execution.save()

        # Create approval log with approver role
        ExecutionLog.objects.create(
            execution=execution,
            step_name=str(current_step) if current_step else "Approval",
            step_type=current_step.step_type if current_step else "approval",
            approval_type=current_step.approval_type if current_step else "general",
            evaluated_rules=evaluated_rules,
            selected_next_step=str(next_step) if next_step else None,
            status="approved",
            approver_id=user.id,
            approver_role=user.role,
            started_at=execution.started_at,
            ended_at=timezone.now()
        )

        return Response({"status": "approved", "execution_id": str(execution.id)})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        execution = self.get_object()
        user = request.user
        
        # Check if execution can be rejected
        if execution.status not in ["pending", "in_progress"]:
            return Response(
                {"error": "Execution cannot be rejected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to reject
        if execution.pending_approval_from:
            if execution.pending_approval_from == "manager" and user.role not in ["manager", "admin"]:
                return Response(
                    {"error": "Only managers can reject this step"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif execution.pending_approval_from == "finance" and user.role not in ["finance", "admin"]:
                return Response(
                    {"error": "Only finance can reject this step"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif execution.pending_approval_from == "ceo" and user.role not in ["ceo", "admin"]:
                return Response(
                    {"error": "Only CEO can reject this step"},
                    status=status.HTTP_403_FORBIDDEN
                )

        execution.status = "failed"
        execution.save()

        # Create rejection log with approver role
        ExecutionLog.objects.create(
            execution=execution,
            step_name=str(execution.current_step) if execution.current_step else "Approval",
            step_type="approval",
            approval_type=execution.current_step.approval_type if execution.current_step else "general",
            evaluated_rules={},
            selected_next_step=None,
            status="rejected",
            approver_id=user.id,
            approver_role=user.role,
            error_message=request.data.get("reason", "Rejected by user"),
            started_at=execution.started_at,
            ended_at=timezone.now()
        )

        return Response({"status": "rejected", "execution_id": str(execution.id)})

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Admin can cancel an execution"""
        execution = self.get_object()
        
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can cancel executions"},
                status=status.HTTP_403_FORBIDDEN
            )

        execution.status = "canceled"
        execution.save()

        # Create cancellation log
        ExecutionLog.objects.create(
            execution=execution,
            step_name="Cancellation",
            step_type="system",
            evaluated_rules={},
            selected_next_step=None,
            status="canceled",
            approver_id=request.user.id,
            approver_role="admin",
            started_at=execution.started_at,
            ended_at=timezone.now()
        )

        return Response({"status": "canceled", "execution_id": str(execution.id)})

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """Admin can retry a failed execution"""
        execution = self.get_object()
        
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can retry executions"},
                status=status.HTTP_403_FORBIDDEN
            )

        if execution.status != "failed":
            return Response(
                {"error": "Only failed executions can be retried"},
                status=status.HTTP_400_BAD_REQUEST
            )

        execution.status = "in_progress"
        execution.retries += 1
        execution.save()

        return Response({"status": "retrying", "execution_id": str(execution.id), "retries": execution.retries})

    @action(detail=True, methods=["get"])
    def logs(self, request, pk=None):
        execution = self.get_object()
        
        # Users can only view logs of their own executions or all if admin/manager
        if request.user.role not in ["admin", "manager", "finance", "ceo"]:
            if execution.triggered_by != request.user:
                return Response(
                    {"error": "You don't have permission to view these logs"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        logs = execution.logs.all()
        serializer = ExecutionLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        execution = self.get_object()
        
        # Users can only view timeline of their own executions or all if admin/manager
        if request.user.role not in ["admin", "manager", "finance", "ceo"]:
            if execution.triggered_by != request.user:
                return Response(
                    {"error": "You don't have permission to view this timeline"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        logs = execution.logs.all().order_by("started_at")
        
        # Format as timeline
        timeline = []
        for log in logs:
            timeline.append({
                "step_name": log.step_name,
                "step_type": log.step_type,
                "approval_type": log.approval_type,
                "status": log.status,
                "approver_id": str(log.approver_id) if log.approver_id else None,
                "approver_role": log.approver_role,
                "started_at": log.started_at,
                "ended_at": log.ended_at,
                "error_message": log.error_message,
            })
        
        return Response(timeline)


class StartExecution(APIView):

    permission_classes = [CanExecuteWorkflow]

    def post(self, request, workflow_id):

        workflow = Workflow.objects.get(id=workflow_id)

        # Determine pending approval based on first approval step
        pending_approval_from = None
        if workflow.start_step and workflow.start_step.step_type == "approval":
            approval_type = workflow.start_step.approval_type
            if approval_type == "manager_approval":
                pending_approval_from = "manager"
            elif approval_type == "finance_approval":
                pending_approval_from = "finance"
            elif approval_type == "ceo_approval":
                pending_approval_from = "ceo"
            else:
                pending_approval_from = "general"

        execution = Execution.objects.create(
            workflow=workflow,
            workflow_version=workflow.version,
            status="in_progress" if not pending_approval_from else "pending",
            data=request.data,
            current_step=workflow.start_step,
            triggered_by=request.user,
            pending_approval_from=pending_approval_from
        )

        return Response({"execution_id": str(execution.id)})


class DashboardStats(APIView):
    """API endpoint for dashboard statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Admin sees all stats
        if user.role == "admin":
            total_users = User.objects.count()
            total_workflows = Workflow.objects.count()
            running = Execution.objects.filter(status='in_progress').count()
            completed = Execution.objects.filter(status='completed').count()
            failed = Execution.objects.filter(status='failed').count()
            pending = Execution.objects.filter(status='pending').count()
        else:
            # Other roles see limited stats
            total_users = 0
            total_workflows = 0
            running = Execution.objects.filter(status='in_progress').count()
            completed = Execution.objects.filter(status='completed').count()
            failed = Execution.objects.filter(status='failed').count()
            pending = Execution.objects.filter(status='pending').count()
        
        return Response({
            'total_users': total_users,
            'total_workflows': total_workflows,
            'running_executions': running,
            'completed_executions': completed,
            'failed_executions': failed,
            'pending_executions': pending,
        })


class DashboardChartData(APIView):
    """API endpoint for dashboard chart data (last 7 days)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        days = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            date_start = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.min.time()))
            date_end = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.max.time()))
            
            completed = Execution.objects.filter(
                status='completed',
                started_at__gte=date_start,
                started_at__lte=date_end
            ).count()
            
            failed = Execution.objects.filter(
                status='failed',
                started_at__gte=date_start,
                started_at__lte=date_end
            ).count()
            
            days.append({
                'date': date.isoformat(),
                'completed': completed,
                'failed': failed,
            })
        
        return Response(days)


class DashboardRecentExecutions(APIView):
    """API endpoint for recent executions"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Filter based on role
        if user.role == "admin":
            executions = Execution.objects.all().order_by('-started_at')[:10]
        elif user.role == "manager":
            executions = Execution.objects.all().order_by('-started_at')[:10]
        else:
            # Employee sees only their own
            executions = Execution.objects.filter(triggered_by=user).order_by('-started_at')[:10]
        
        serializer = ExecutionSerializer(executions, many=True)
        return Response(serializer.data)


class UserDashboardStats(APIView):
    """API endpoint for user-specific dashboard statistics (Employee)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get user's execution counts
        pending = Execution.objects.filter(
            triggered_by=user,
            status='pending'
        ).count()
        
        completed = Execution.objects.filter(
            triggered_by=user,
            status='completed'
        ).count()
        
        in_progress = Execution.objects.filter(
            triggered_by=user,
            status='in_progress'
        ).count()
        
        failed = Execution.objects.filter(
            triggered_by=user,
            status='failed'
        ).count()
        
        return Response({
            'pending': pending,
            'completed': completed,
            'in_progress': in_progress,
            'failed': failed,
        })


class ManagerDashboardStats(APIView):
    """API endpoint for manager-specific dashboard statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Only managers, finance, ceo, and admin should see approval stats
        if user.role not in ["manager", "finance", "ceo", "admin"]:
            return Response({
                'pending_approvals': 0,
                'approved_this_week': 0,
                'rejected_this_week': 0,
            })
        
        # Get pending approvals count
        pending_approvals = Execution.objects.filter(status='pending').count()
        
        # Get this week's approved/rejected counts
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_start = timezone.make_aware(timezone.datetime.combine(week_start, timezone.datetime.min.time()))
        
        approved = ExecutionLog.objects.filter(
            status='approved',
            approver_id=user.id,
            started_at__gte=week_start
        ).count()
        
        rejected = ExecutionLog.objects.filter(
            status='rejected',
            approver_id=user.id,
            started_at__gte=week_start
        ).count()
        
        return Response({
            'pending_approvals': pending_approvals,
            'approved_this_week': approved,
            'rejected_this_week': rejected,
        })


class ApprovalTasksView(APIView):
    """API endpoint to get approval tasks for the current user"""
    permission_classes = [CanViewApprovalTasks]

    def get(self, request):
        user = request.user
        
        # Get executions pending approval based on user role
        if user.role == "manager":
            executions = Execution.objects.filter(
                status='pending',
                pending_approval_from__in=['manager', 'general']
            )
        elif user.role == "finance":
            executions = Execution.objects.filter(
                status='pending',
                pending_approval_from__in=['finance', 'general']
            )
        elif user.role == "ceo":
            executions = Execution.objects.filter(
                status='pending',
                pending_approval_from__in=['ceo', 'general']
            )
        elif user.role == "admin":
            # Admin can see all pending
            executions = Execution.objects.filter(status='pending')
        else:
            executions = Execution.objects.none()
        
        serializer = ExecutionSerializer(executions, many=True)
        return Response(serializer.data)
