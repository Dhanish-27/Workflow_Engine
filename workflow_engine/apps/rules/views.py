from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Rule
from .serializers import RuleSerializer
from .permissions import CanManageRules


class RuleViewSet(ModelViewSet):

    queryset = Rule.objects.all()

    serializer_class = RuleSerializer

    permission_classes = [IsAuthenticated, CanManageRules]

    filterset_fields = ["step"]

    def get_queryset(self):
        queryset = super().get_queryset()
        workflow = self.request.query_params.get('workflow')
        if workflow:
            queryset = queryset.filter(step__workflow_id=workflow)
        return queryset

    def perform_create(self, serializer):
        # Auto-generate name if not provided
        name = serializer.validated_data.get('name')
        if not name:
            step = serializer.validated_data.get('step')
            count = Rule.objects.filter(step=step).count() + 1
            serializer.save(name=f"Rule {count}")
        else:
            serializer.save()