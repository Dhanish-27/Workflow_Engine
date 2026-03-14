from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Workflow, WorkflowField
from .serializers import WorkflowSerializer, WorkflowFieldSerializer
from .permissions import CanManageWorkflow, CanViewWorkflow


class WorkflowViewSet(ModelViewSet):

    queryset = Workflow.objects.all()

    serializer_class = WorkflowSerializer

    permission_classes = [IsAuthenticated]


class WorkflowFieldViewSet(ModelViewSet):

    queryset = WorkflowField.objects.all()

    serializer_class = WorkflowFieldSerializer

    permission_classes = [IsAuthenticated]

    filterset_fields = ["workflow"]