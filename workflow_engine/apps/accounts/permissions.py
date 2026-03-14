from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Admin has full control over the platform"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class IsEmployee(BasePermission):
    """Employee can start workflow executions and view their own executions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "employee"


class IsManager(BasePermission):
    """Manager can approve/reject steps and view approval logs"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "manager"


class IsFinance(BasePermission):
    """Finance can approve finance-related steps"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "finance"


class IsCEO(BasePermission):
    """CEO can do final approval"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "ceo"


# Combined permissions for common use cases
class CanManageWorkflows(BasePermission):
    """Admin can manage workflows"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanManageUsers(BasePermission):
    """Admin can manage users"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanExecuteWorkflow(BasePermission):
    """Employee can execute (start) workflows"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["employee", "admin"]


class CanManageSteps(BasePermission):
    """Admin can manage steps"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanManageRules(BasePermission):
    """Admin can manage rules"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanApproveStep(BasePermission):
    """Users who can approve steps based on role and step type"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Admin can approve anything
        if request.user.role == "admin":
            return True
        # For specific approval types, check role
        approval_type = getattr(view, 'approval_type', None)
        if approval_type == "manager_approval":
            return request.user.role == "manager"
        elif approval_type == "finance_approval":
            return request.user.role == "finance"
        elif approval_type == "ceo_approval":
            return request.user.role == "ceo"
        # Default: manager, finance, ceo can approve general approvals
        return request.user.role in ["manager", "finance", "ceo", "admin"]


class CanViewAllExecutions(BasePermission):
    """Admin and Managers can view all executions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["admin", "manager"]


class CanViewOwnExecutions(BasePermission):
    """Users can view their own executions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # All authenticated users can view their own


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
