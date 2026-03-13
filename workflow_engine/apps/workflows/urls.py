from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, WorkflowFieldViewSet

router = DefaultRouter()

router.register("workflows", WorkflowViewSet)
router.register("workflow-fields", WorkflowFieldViewSet)

urlpatterns = router.urls