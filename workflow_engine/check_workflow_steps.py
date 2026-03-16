import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workflow_engine.settings')
django.setup()

from apps.workflows.models import Workflow
from apps.steps.models import Step

print("--- Workflows ---")
for w in Workflow.objects.all():
    print(f"ID: {w.id}, Name: {w.name}, Start Step: {w.start_step.name if w.start_step else 'None'}")
    
    steps = Step.objects.filter(workflow=w).order_by('order')
    print(f"  Steps ({steps.count()}):")
    for s in steps:
        print(f"    - ID: {s.id}, Name: {s.name}, Type: {s.step_type}, Approval Type: {s.approval_type}, Order: {s.order}")
