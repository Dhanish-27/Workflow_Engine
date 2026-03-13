from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.workflows.models import Workflow
from .models import Execution


class StartExecution(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, workflow_id):

        workflow = Workflow.objects.get(id=workflow_id)

        execution = Execution.objects.create(
            workflow=workflow,
            workflow_version=workflow.version,
            status="in_progress",
            data=request.data,
            current_step=workflow.start_step,
            triggered_by=request.user
        )

        return Response({"execution_id": execution.id})