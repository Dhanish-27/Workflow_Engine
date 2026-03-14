from rest_framework.permissions import BasePermission


class CanExecuteWorkflow(BasePermission):
    """Employee and Admin can execute (start) workflows"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["employee", "admin"]


class CanApproveExecution(BasePermission):
    """Users can approve executions based on their role and the step type"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can approve anything
        if request.user.role == "admin":
            return True
        
        # Check if user can approve based on execution's pending_approval_from
        execution = view.get_object() if hasattr(view, 'get_object') else None
        
        if execution and execution.pending_approval_from:
            if execution.pending_approval_from == "manager":
                return request.user.role == "manager"
            elif execution.pending_approval_from == "finance":
                return request.user.role == "finance"
            elif execution.pending_approval_from == "ceo":
                return request.user.role == "ceo"
            else:
                # General approval - manager, finance, ceo can approve
                return request.user.role in ["manager", "finance", "ceo"]
        
        # If no specific role required, allow manager, finance, ceo
        return request.user.role in ["manager", "finance", "ceo", "admin"]


class CanViewAllExecutions(BasePermission):
    """Admin and Manager can view all executions"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["admin", "manager"]


class CanViewExecution(BasePermission):
    """Users can view executions based on their role"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # All authenticated users can view


class CanCancelExecution(BasePermission):
    """Admin can cancel executions"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanRetryExecution(BasePermission):
    """Admin can retry failed executions"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanViewApprovalTasks(BasePermission):
    """Users can view approval tasks based on their role"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Managers, Finance, CEO, and Admin can view approval tasks
        return request.user.role in ["manager", "finance", "ceo", "admin"]
