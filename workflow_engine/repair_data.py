import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workflow_engine.settings')
django.setup()

from apps.workflows.models import Workflow
from apps.executions.models import Execution
from apps.executions.engine import process_execution

print("--- Repairing Workflows ---")
for w in Workflow.objects.filter(start_step__isnull=True):
    first_step = w.steps.order_by('order').first()
    if first_step:
        print(f"Setting start_step for workflow: {w.name} to {first_step.name}")
        w.start_step = first_step
        w.save()
    else:
        print(f"Workflow {w.name} has no steps, skipping.")

print("\n--- Repairing Executions ---")
for e in Execution.objects.filter(status='in_progress', current_step__isnull=True):
    print(f"Repairing stalled execution ID: {e.id} for workflow: {e.workflow.name}")
    process_execution(e)
    # Refresh to see new status
    e.refresh_from_db()
    print(f"  New Status: {e.status}, Current Step: {e.current_step.name if e.current_step else 'None'}, Pending From: {e.pending_approval_from}")
