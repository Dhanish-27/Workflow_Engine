from django.contrib import admin
from django.urls import path,include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Accounts
    path("api/accounts/", include("apps.accounts.urls")),

    # Notifications
    path("api/notifications/", include("apps.notifications.urls")),

    # Workflow Engine
    path("api/workflows/", include("apps.workflows.urls")),
    path("api/steps/", include("apps.steps.urls")),
    path("api/rules/", include("apps.rules.urls")),
    path("api/executions/", include("apps.executions.urls")),
]