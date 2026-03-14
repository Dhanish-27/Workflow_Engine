from rest_framework.permissions import BasePermission


class CanManageWorkflow(BasePermission):
    """Only Admin can manage (create/edit/delete) workflows"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class CanViewWorkflow(BasePermission):
    """Users can view workflows based on their role"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # All authenticated users can view workflows
