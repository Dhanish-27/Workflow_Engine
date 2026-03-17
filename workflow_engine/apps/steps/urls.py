from rest_framework.routers import DefaultRouter
from .views import StepViewSet, TaskDefinitionViewSet

router = DefaultRouter()
router.register("steps", StepViewSet)
router.register("definitions", TaskDefinitionViewSet)

urlpatterns = router.urls