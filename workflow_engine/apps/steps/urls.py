from rest_framework.routers import DefaultRouter
from .views import StepViewSet

router = DefaultRouter()
router.register("steps", StepViewSet)

urlpatterns = router.urls