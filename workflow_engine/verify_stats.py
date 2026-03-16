import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workflow_engine.settings')
django.setup()

from apps.executions.models import Execution
from apps.accounts.models import User
from apps.workflows.models import Workflow

print("--- Backend Stats ---")
running = Execution.objects.filter(status='in_progress').count()
completed = Execution.objects.filter(status='completed').count()
failed = Execution.objects.filter(status='failed').count()
pending = Execution.objects.filter(status='pending').count()

print(f"Running: {running}")
print(f"Pending: {pending}")
print(f"Completed: {completed}")
print(f"Failed: {failed}")

print("\n--- Recent Executions ---")
for e in Execution.objects.all().order_by('-started_at')[:5]:
    print(f"ID: {e.id}, Status: {e.status}")
