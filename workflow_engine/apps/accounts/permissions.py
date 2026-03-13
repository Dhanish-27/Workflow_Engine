from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """
    Custom permission to allow only users with admin role.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return getattr(user, "role", None) == "admin"