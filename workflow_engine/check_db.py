import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workflow_engine.settings')
django.setup()

from apps.executions.models import Execution
from apps.accounts.models import User

print("--- Executions ---")
for e in Execution.objects.all():
    step_name = e.current_step.name if e.current_step else "None"
    step_type = e.current_step.step_type if e.current_step else "None"
    approval_type = e.current_step.approval_type if e.current_step and e.current_step.step_type == "approval" else "N/A"
    print(f"ID: {e.id}, Workflow: {e.workflow.name}, Status: {e.status}, Step: {step_name}, Type: {step_type}, Approval Type: {approval_type}, Pending From: {e.pending_approval_from}")

print("\n--- Users ---")
for u in User.objects.all():
    print(f"Username: {u.username}, Role: {u.role}")
