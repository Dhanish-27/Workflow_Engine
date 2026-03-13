from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from .models import Rule
from .serializers import RuleSerializer
from .permissions import CanManageRules


class RuleViewSet(ModelViewSet):

    queryset = Rule.objects.all()

    serializer_class = RuleSerializer

    permission_classes = [CanManageRules]

    filterset_fields = ["step"]