from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Step
from .serializers import StepSerializer
from .permissions import CanManageSteps


class StepViewSet(ModelViewSet):

    queryset = Step.objects.all()

    serializer_class = StepSerializer

    permission_classes = [IsAuthenticated, CanManageSteps]

    filterset_fields = ["workflow"]

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, CanManageSteps])
    def reorder(self, request):
        """Reorder steps by providing a list of step IDs with their new order."""
        steps_data = request.data.get('steps', [])
        
        if not steps_data:
            return Response({'error': 'No steps provided'}, status=400)
        
        for item in steps_data:
            step_id = item.get('id')
            new_order = item.get('order')
            
            if step_id and new_order is not None:
                Step.objects.filter(id=step_id).update(order=new_order)
        
        return Response({'success': True})