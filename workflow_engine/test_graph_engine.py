import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.workflows.models import Workflow
from apps.steps.models import Step, TaskDefinition
from apps.rules.models import Rule, RuleCondition
from apps.executions.models import Execution, WorkflowExecution, StepExecution
from apps.executions.services.workflow_engine import start_workflow, resume_after_task

User = get_user_model()

def run_smoke_test():
    print("=== STARTING SMOKE TEST ===")
    
    # 1. Setup user
    user, _ = User.objects.get_or_create(username="test_automator", email="test@auto.com")
    
    # 2. Setup workflow
    wf, _ = Workflow.objects.get_or_create(name="Smoke Test Graph Workflow", description="Auto generated")
    
    # 3. Setup steps (Nodes)
    # Start -> Notification -> Task -> End
    
    step1_start, _ = Step.objects.get_or_create(
        workflow=wf, name="Step 1 (Start Notification)", step_type="notification", is_start=True
    )
    
    step2_task, _ = Step.objects.get_or_create(
        workflow=wf, name="Step 2 (Mock Task)", step_type="task", assigned_to=user
    )
    
    # 4. Setup rules (Edges)
    
    # Rule 1: step1 -> step2 (Default)
    rule1, _ = Rule.objects.get_or_create(
        step=step1_start, name="Goto Task", is_default=True, next_step=step2_task
    )
    
    # Clean up old executions for this test workflow
    Execution.objects.filter(workflow=wf).delete()
    
    # 5. Start Execution
    print(f"Creating execution for workflow {wf.name}...")
    execution = Execution.objects.create(
        workflow=wf,
        workflow_version=wf.version,
        status="in_progress",
        data={"test_key": "test_value"},
        current_step=step1_start,
        triggered_by=user,
    )
    
    # 6. Run Engine (should blast through notification, create task, and pause on step 2)
    print("Starting engine...")
    res = start_workflow(execution)
    
    print(f"Engine result after start: {res}")
    
    execution.refresh_from_db()
    print(f"Legacy Execution Status: {execution.status}, Current Step: {execution.current_step.name}")
    
    wf_exec = execution.graph_execution
    print(f"Graph Execution Status: {wf_exec.status}, Current Step: {wf_exec.current_step.name}")
    print(f"Data bag: {wf_exec.data}")
    
    # Validate it paused on Task
    assert execution.status == "pending", "Should be pending waiting for task"
    assert wf_exec.status == "RUNNING", "Graph should still be running"
    assert wf_exec.current_step == step2_task, "Should be paused on step 2"
    
    # 7. Resume Task (simulate user completing task via API)
    print("\nSimulating task completion...")
    task_data = {"user_input": "completed graph task!"}
    res2 = resume_after_task(execution, task_data)
    
    print(f"Engine result after task complete: {res2}")
    
    execution.refresh_from_db()
    wf_exec.refresh_from_db()
    
    print(f"Legacy Execution Status: {execution.status}")
    print(f"Graph Execution Status: {wf_exec.status}")
    print(f"Final Data bag: {wf_exec.data}")
    
    # Validate it completed (since no outgoing rules from step 2)
    assert execution.status == "completed", "Should be completed"
    assert wf_exec.status == "COMPLETED", "Graph should be completed"
    assert wf_exec.data["user_input"] == "completed graph task!", "Data bag should contain task output"
    
    print("=== SMOKE TEST PASSED ===")

if __name__ == "__main__":
    run_smoke_test()
