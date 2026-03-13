from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from .models import Step
from .serializers import StepSerializer
from .permissions import CanManageSteps


class StepViewSet(ModelViewSet):

    queryset = Step.objects.all()

    serializer_class = StepSerializer

    permission_classes = [CanManageSteps]

    filterset_fields = ["workflow"]