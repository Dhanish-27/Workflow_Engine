from rest_framework.routers import DefaultRouter
from .views import RuleViewSet


router = DefaultRouter()

router.register("rules", RuleViewSet, basename="rules")

urlpatterns = router.urls