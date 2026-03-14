from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ExecutionViewSet, StartExecution, DashboardStats, DashboardChartData, DashboardRecentExecutions, UserDashboardStats, ManagerDashboardStats, ApprovalTasksView

router = DefaultRouter()

router.register("", ExecutionViewSet, basename="execution")

urlpatterns = [
    path("start/<uuid:workflow_id>/", StartExecution.as_view(), name="start-execution"),
    path("dashboard/stats/", DashboardStats.as_view(), name="dashboard-stats"),
    path("dashboard/chart-data/", DashboardChartData.as_view(), name="dashboard-chart-data"),
    path("dashboard/recent/", DashboardRecentExecutions.as_view(), name="dashboard-recent-executions"),
    path("dashboard/user-stats/", UserDashboardStats.as_view(), name="dashboard-user-stats"),
    path("dashboard/manager-stats/", ManagerDashboardStats.as_view(), name="dashboard-manager-stats"),
    path("approvals/", ApprovalTasksView.as_view(), name="approval-tasks"),
    path("", include(router.urls)),
]
