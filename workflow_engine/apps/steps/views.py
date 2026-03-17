from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Step, TaskDefinition
from .serializers import StepSerializer, TaskDefinitionSerializer
from .permissions import CanManageSteps


class TaskDefinitionViewSet(ModelViewSet):
    queryset = TaskDefinition.objects.all()
    serializer_class = TaskDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Handle file uploads for task form fields."""
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
        
        # In a production environment, you would save the file to cloud storage
        # For now, we'll return a simple response with the file info
        return Response({
            'url': f'/media/uploads/{file_obj.name}',
            'file_name': file_obj.name,
            'file_size': file_obj.size,
            'content_type': file_obj.content_type
        })


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