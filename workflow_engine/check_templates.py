import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workflow_engine.settings')
django.setup()

from apps.steps.models import TaskDefinition

definitions = TaskDefinition.objects.all()
print(f"Total Task Definitions: {definitions.count()}")
for d in definitions:
    print(f"ID: {d.id}, Name: {d.name}, Type: {d.task_type}")
