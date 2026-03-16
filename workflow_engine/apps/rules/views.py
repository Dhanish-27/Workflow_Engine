from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max

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

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder rules for a step.
        Expected data: {"rules": [{"id": "uuid", "priority": 1}, ...]}
        """
        from django.db import transaction
        
        rules_data = request.data.get('rules', [])
        if not rules_data:
            return Response({"error": "No rules data provided"}, status=400)
            
        try:
            with transaction.atomic():
                updated_count = 0
                for item in rules_data:
                    rule_id = item.get('id')
                    priority = item.get('priority')
                    if rule_id and priority is not None:
                        # Use update() to avoid re-triggering full_clean or other validation
                        # that might block if intermediate states have duplicate priorities
                        updated = Rule.objects.filter(id=rule_id).update(priority=priority)
                        if updated:
                            updated_count += 1
                
                return Response({
                    "status": "reordered", 
                    "count": updated_count,
                    "message": f"Successfully updated {updated_count} rules"
                })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def perform_create(self, serializer):
        serializer.save()