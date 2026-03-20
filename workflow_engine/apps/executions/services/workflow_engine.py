"""
Graph-Based Workflow Engine Service
=====================================
Pure rule-driven execution: every step transition is determined
exclusively by Rule edges (from_step → to_step).

Key functions:
  run_workflow(wf_execution, input_data)   → main execution loop
  evaluate_rules(step, input_data)         → picks next step via rules
  evaluate_condition(condition, input_data)→ True/False for one condition
  execute_step(step, wf_execution)         → dispatches to step-type handler
"""
import logging
from django.utils import timezone
from django.db import transaction

from apps.executions.models import WorkflowExecution, StepExecution, ExecutionLog, Task
from apps.accounts.models import User
from apps.notifications.services import (
    notify_approval_required,
    notify_approved,
    notify_completed,
)
from apps.emails.services import (
    send_approval_required_email,
    send_approved_email,
    send_completed_email,
)

logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────────
# Public entry points
# ────────────────────────────────────────────────────────────

def run_workflow(workflow_execution: WorkflowExecution, input_data: dict = None) -> dict:
    """
    Main graph execution loop.

    Walks the step-graph driven purely by Rule edges until:
      - A step requires human action  (APPROVAL / TASK)  → pauses
      - No outgoing default rule                          → marks COMPLETED
      - Loop limit exceeded                               → marks FAILED
      - Any unhandled exception                           → marks FAILED

    Args:
        workflow_execution: WorkflowExecution instance (status must be RUNNING)
        input_data: Optional dict merged into workflow_execution.data

    Returns:
        dict with keys: success (bool), status, message / error
    """
    if input_data:
        merged = dict(workflow_execution.data)
        merged.update(input_data)
        workflow_execution.data = merged
        workflow_execution.save(update_fields=["data"])

    try:
        with transaction.atomic():
            # Ensure we have a starting step
            if not workflow_execution.current_step:
                start_step = workflow_execution.get_start_step()
                if not start_step:
                    # Try to get step marked as is_start_step
                    from apps.steps.models import Step
                    start_step = Step.objects.filter(
                        workflow=workflow_execution.workflow,
                        is_start_step=True
                    ).first()
                if not start_step:
                    return _fail(workflow_execution, "No start step defined for workflow")
                workflow_execution.current_step = start_step
                workflow_execution.save(update_fields=["current_step"])

            # Guard: global step cap
            MAX_TOTAL = 50
            iterations = 0

            while workflow_execution.status == "RUNNING":
                if iterations >= MAX_TOTAL:
                    return _fail(workflow_execution, "Global step limit (50) exceeded")
                iterations += 1

                current_step = workflow_execution.current_step

                # ── Loop guard ──────────────────────────────────────
                step_exec, _ = StepExecution.objects.get_or_create(
                    workflow_execution=workflow_execution,
                    step=current_step,
                    defaults={"status": "IN_PROGRESS", "execution_count": 0},
                )
                can_continue, loop_error = step_exec.increment_execution_count()
                if not can_continue:
                    return _fail(workflow_execution, loop_error)

                # ── Execute the step ─────────────────────────────────
                step_result = _execute_step(current_step, step_exec, workflow_execution)

                if not step_result["can_continue"]:
                    # Step is paused waiting for human action
                    return {
                        "success": True,
                        "status": "PENDING",
                        "message": step_result.get("message", "Awaiting action"),
                        "requires_action": True,
                        "action_type": step_result.get("action_type"),
                    }

                # ── Evaluate rules to pick next step ─────────────────
                next_step, evaluated_rules = evaluate_rules(current_step, workflow_execution.data)

                # Log the transition
                _log_transition(
                    workflow_execution=workflow_execution,
                    step=current_step,
                    next_step=next_step,
                    evaluated_rules=evaluated_rules,
                    status="completed",
                )

                workflow_execution.increment_step_count()

                if next_step is None:
                    # No outgoing rule → workflow finished
                    _send_completion_notifications(workflow_execution)
                    workflow_execution.mark_completed()
                    return {
                        "success": True,
                        "status": "COMPLETED",
                        "message": "Workflow completed successfully",
                        "total_steps": workflow_execution.total_steps_executed,
                    }

                # Advance to next step
                step_exec.complete(step_result.get("result_data", {}))
                workflow_execution.current_step = next_step
                workflow_execution.save(update_fields=["current_step"])

                # Sync legacy Execution.current_step
                if workflow_execution.execution:
                    workflow_execution.execution.current_step = next_step
                    workflow_execution.execution.save(update_fields=["current_step"])

    except Exception as exc:
        logger.exception("Unhandled error in run_workflow for %s", workflow_execution.id)
        return _fail(workflow_execution, str(exc))

    # Should not reach here under normal conditions
    return {
        "success": True,
        "status": workflow_execution.status,
        "message": "Execution loop exited",
    }


# ────────────────────────────────────────────────────────────
# Rule / Condition Evaluation
# ────────────────────────────────────────────────────────────

def evaluate_rules(step, input_data: dict) -> tuple:
    """
    Pick the next step by evaluating all outgoing Rule edges from `step`.

    Algorithm:
      1. Fetch all rules where rule.from_step == step  (i.e. from_step == step)
      2. Separate into condition_rules and default_rule
      3. Sort condition_rules by priority ASC
      4. Evaluate each condition_rule (AND logic across its conditions)
         → first match wins
      5. If nothing matched → use default_rule
      6. If no default → return None (workflow ends / error handled by caller)

    Returns:
        (next_step, evaluated_rules_log)
        next_step: Step | None
        evaluated_rules_log: list[dict]  (for ExecutionLog)
    """
    from apps.rules.models import Rule

    # Get rules using new from_step field, fall back to legacy step field
    rules = Rule.objects.filter(from_step=step).order_by("priority").select_related("to_step")
    
    if not rules.exists():
        # Fall back to legacy field
        rules = Rule.objects.filter(step=step).order_by("priority").select_related("next_step")

    condition_rules = []
    default_rule = None
    evaluated_log = []

    for rule in rules:
        if rule.is_default or rule.rule_type == 'DEFAULT':
            default_rule = rule
        else:
            condition_rules.append(rule)

    # Evaluate conditional rules in priority order
    for rule in condition_rules:
        matched = _evaluate_rule_conditions(rule, input_data)
        evaluated_log.append({"rule_id": str(rule.id), "name": rule.name, "matched": matched})
        if matched:
            # Use get_to_step() to handle both new and legacy fields
            next_step = rule.get_to_step()
            logger.debug("Rule '%s' matched → next step '%s'", rule.name, next_step)
            return next_step, evaluated_log

    # Fall back to default rule
    if default_rule:
        evaluated_log.append({
            "rule_id": str(default_rule.id),
            "name": default_rule.name,
            "matched": True,
            "is_default": True,
        })
        # Use get_to_step() to handle both new and legacy fields
        return default_rule.get_to_step(), evaluated_log

    # No rule matched and no default → workflow ends
    logger.warning("No matching rule (and no default) found for step '%s'", step.name)
    return None, evaluated_log


def _evaluate_rule_conditions(rule, input_data: dict) -> bool:
    """
    Evaluate all RuleCondition objects attached to a Rule.
    Combines results via rule.logical_operator (AND / OR).
    Falls back to legacy JSON condition field if no RuleCondition rows.
    """
    conditions = rule.conditions.all()

    if conditions.exists():
        results = []
        for condition in conditions:
            actual_value = _resolve_field_value(condition.field_name, input_data, rule)
            result = evaluate_condition(condition, actual_value)
            results.append(result)

        if not results:
            return False
        if rule.logical_operator == "OR":
            return any(results)
        return all(results)

    elif rule.condition:
        # Legacy JSON fallback
        from apps.rules.services.rule_engine import evaluate_rule
        return evaluate_rule(rule, input_data)

    return False


def _resolve_field_value(field_name: str, input_data: dict, rule=None):
    """
    Looks up a field value in input_data. Handles UUID field names by
    resolving them to field name strings via WorkflowField lookup.
    """
    from apps.workflows.models import WorkflowField

    # Direct lookup first
    value = input_data.get(field_name)
    if value is not None:
        return value

    # If field_name looks like a UUID, try WorkflowField resolution
    if field_name and len(field_name) == 36 and "-" in field_name:
        try:
            wf = WorkflowField.objects.get(id=field_name)
            value = input_data.get(wf.name)
            if value is not None:
                return value
        except WorkflowField.DoesNotExist:
            pass

    return None


def evaluate_condition(condition, actual_value) -> bool:
    """
    Evaluate a single RuleCondition against a runtime value.

    Args:
        condition: RuleCondition model instance (has .operator, .value)
                   OR a dict with keys 'operator' and 'value'
        actual_value: The actual runtime value from input_data

    Returns:
        bool
    """
    if hasattr(condition, "operator"):
        operator = condition.operator
        expected = condition.value
    else:
        operator = condition.get("operator")
        expected = condition.get("value")

    if not operator:
        return False

    if actual_value is None:
        # Only is_false / is_true can match None-like falsy
        if operator == "is_false":
            return True
        return False

    # Numeric coercion
    numeric_ops = {"eq", "neq", "gt", "gte", "lt", "lte"}
    if operator in numeric_ops:
        try:
            actual_value = float(actual_value)
            expected = float(expected)
        except (ValueError, TypeError):
            pass

    try:
        switch = {
            # Numeric / equality
            "eq":         lambda: actual_value == expected,
            "neq":        lambda: actual_value != expected,
            "gt":         lambda: actual_value > expected,
            "gte":        lambda: actual_value >= expected,
            "lt":         lambda: actual_value < expected,
            "lte":        lambda: actual_value <= expected,
            # Text
            "equals":     lambda: str(actual_value).lower() == str(expected).lower(),
            "not_equals": lambda: str(actual_value).lower() != str(expected).lower(),
            "contains":   lambda: str(expected).lower() in str(actual_value).lower(),
            "starts_with":lambda: str(actual_value).lower().startswith(str(expected).lower()),
            "ends_with":  lambda: str(actual_value).lower().endswith(str(expected).lower()),
            # Collection
            "in":         lambda: actual_value in (expected if isinstance(expected, list) else [expected]),
            "not_in":     lambda: actual_value not in (expected if isinstance(expected, list) else [expected]),
            # Boolean
            "is_true":    lambda: actual_value is True or str(actual_value).lower() == "true",
            "is_false":   lambda: actual_value is False or str(actual_value).lower() == "false",
            # Date
            "before":     lambda: _compare_dates(actual_value, expected) < 0,
            "after":      lambda: _compare_dates(actual_value, expected) > 0,
        }
        fn = switch.get(operator)
        if fn:
            return fn()
    except Exception as exc:
        logger.debug("Condition evaluation error: %s", exc)

    return False


def _compare_dates(d1, d2) -> int:
    """Returns -1/0/1 by comparing two date strings or date objects."""
    from datetime import datetime
    formats = ["%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"]

    def parse(d):
        if not isinstance(d, str):
            return d
        for fmt in formats:
            try:
                return datetime.strptime(d, fmt)
            except (ValueError, TypeError):
                continue
        return None

    a, b = parse(d1), parse(d2)
    if a is None or b is None:
        return 0
    return -1 if a < b else (1 if a > b else 0)


# ────────────────────────────────────────────────────────────
# Step Execution Handlers
# ────────────────────────────────────────────────────────────

def _execute_step(step, step_exec: StepExecution, wf_execution: WorkflowExecution) -> dict:
    """
    Dispatch execution based on step type.

    Returns dict with:
        can_continue (bool)     – False means paused, True means proceed
        action_type  (str|None) – 'approval' | 'task' | None
        message      (str)
        result_data  (dict)
    """
    step_type = step.step_type.lower()

    if step_type == "approval":
        return _execute_approval_step(step, step_exec, wf_execution)
    elif step_type == "task":
        return _execute_task_step(step, step_exec, wf_execution)
    elif step_type == "notification":
        return _execute_notification_step(step, step_exec, wf_execution)
    else:
        logger.warning("Unknown step_type '%s' on step '%s' — auto-completing", step.step_type, step.name)
        return {"can_continue": True, "result_data": {}, "message": "Unknown step type, auto-completed"}


def _execute_approval_step(step, step_exec: StepExecution, wf_execution: WorkflowExecution) -> dict:
    """
    Approval steps pause until an approver calls the /approve endpoint.
    The approval result is stored in step_exec.result_data by the view.
    """
    approval_status = step_exec.result_data.get("approval_status")

    if approval_status:
        # Approval has been given — continue
        # Propagate the decision into the shared data bag
        wf_execution.data["approval_status"] = approval_status
        wf_execution.save(update_fields=["data"])
        return {
            "can_continue": True,
            "result_data": step_exec.result_data,
            "message": f"Step '{step.name}' approved",
        }

    # No approval yet — set legacy execution state and pause
    _sync_legacy_approval_state(step, wf_execution)

    try:
        if wf_execution.execution:
            notify_approval_required(wf_execution.execution)
            send_approval_required_email(wf_execution.execution)
    except Exception as exc:
        logger.warning("Approval notification error: %s", exc)

    step_exec.status = "PENDING"
    step_exec.save(update_fields=["status", "updated_at"])

    return {
        "can_continue": False,
        "action_type": "approval",
        "message": f"Waiting for approval on step '{step.name}'",
    }


def _sync_legacy_approval_state(step, wf_execution: WorkflowExecution):
    """Sync approval state to legacy Execution model for API visibility."""
    if not wf_execution.execution:
        return
    approval_type_map = {
        "manager_approval": "manager",
        "finance_approval": "finance",
        "ceo_approval":     "ceo",
        "general":          "general",
    }
    role = approval_type_map.get(getattr(step, "approval_type", "general"), "general")
    wf_execution.execution.status = "pending"
    wf_execution.execution.pending_approval_from = role
    wf_execution.execution.current_step = step
    wf_execution.execution.save(update_fields=["status", "pending_approval_from", "current_step"])


def _execute_task_step(step, step_exec: StepExecution, wf_execution: WorkflowExecution) -> dict:
    """
    Task steps create a Task record and pause until it is completed.
    Completion is signalled via step_exec.result_data['task_completed'].
    """
    task_completed = step_exec.result_data.get("task_completed", False)

    if task_completed:
        # Merge task output into shared data bag
        task_data = step_exec.result_data.get("task_data", {})
        if task_data:
            merged = dict(wf_execution.data)
            merged.update(task_data)
            wf_execution.data = merged
            wf_execution.save(update_fields=["data"])
        return {
            "can_continue": True,
            "result_data": step_exec.result_data,
            "message": f"Task '{step.name}' completed",
        }

    # Check if an existing pending task already exists (idempotent)
    legacy_exec = wf_execution.execution
    if legacy_exec:
        pending = Task.objects.filter(execution=legacy_exec, step=step, status="pending")
        if pending.exists():
            step_exec.status = "PENDING"
            step_exec.save(update_fields=["status", "updated_at"])
            _sync_legacy_task_state(step, wf_execution)
            return {
                "can_continue": False,
                "action_type": "task",
                "message": f"Waiting for task completion on step '{step.name}'",
            }

    # Create new task(s)
    _create_task_for_step(step, wf_execution)
    step_exec.status = "PENDING"
    step_exec.save(update_fields=["status", "updated_at"])
    _sync_legacy_task_state(step, wf_execution)

    return {
        "can_continue": False,
        "action_type": "task",
        "message": f"Task created and waiting for completion on step '{step.name}'",
    }


def _create_task_for_step(step, wf_execution: WorkflowExecution):
    """Create Task record(s) for a task step and log it."""
    legacy_exec = wf_execution.execution
    if not legacy_exec:
        logger.warning("No legacy execution linked to WorkflowExecution %s", wf_execution.id)
        return

    task_title = step.name
    task_description = step.description
    task_form_fields = step.form_fields
    task_type = step.task_template or "generic"
    verify_fields = []
    original_data = dict(wf_execution.data) if wf_execution.data else {}

    if step.task_definition:
        td = step.task_definition
        task_title = td.name
        task_description = td.description
        task_form_fields = td.form_fields
        if not step.task_template:
            task_type = td.task_type
        for field in (td.form_fields or []):
            if isinstance(field, dict) and field.get("is_verify_field"):
                fname = field.get("field_name") or field.get("name") or field.get("key")
                if fname:
                    verify_fields.append(fname)

    def make_task(user):
        return Task.objects.create(
            execution=legacy_exec,
            step=step,
            assigned_to=user,
            title=task_title,
            description=task_description,
            form_fields=task_form_fields,
            task_type=task_type,
            verify_fields=verify_fields,
            original_data=original_data,
            status="pending",
        )

    assigned_user = step.assigned_to
    assigned_role = step.assigned_role

    if assigned_user:
        make_task(assigned_user)
    elif assigned_role:
        users = User.objects.filter(role=assigned_role)
        if users.exists():
            for u in users:
                make_task(u)
        else:
            logger.warning("No users with role '%s' for step '%s'", assigned_role, step.name)
    elif wf_execution.triggered_by:
        make_task(wf_execution.triggered_by)
    else:
        logger.warning("No assignee for task step '%s'", step.name)

    # Log task creation
    ExecutionLog.objects.create(
        execution=legacy_exec,
        step_name=step.name,
        step_type=step.step_type,
        evaluated_rules=[],
        selected_next_step=None,
        status="pending",
        started_at=timezone.now(),
        ended_at=timezone.now(),
    )


def _sync_legacy_task_state(step, wf_execution: WorkflowExecution):
    """Sync task-pending state to legacy Execution model."""
    if not wf_execution.execution:
        return
    role = step.assigned_role or (
        f"User: {wf_execution.execution.triggered_by.username}"
        if wf_execution.execution.triggered_by else "unassigned"
    )
    wf_execution.execution.status = "pending"
    wf_execution.execution.pending_task_from = role
    wf_execution.execution.current_step = step
    wf_execution.execution.save(update_fields=["status", "pending_task_from", "current_step"])


def _execute_notification_step(step, step_exec: StepExecution, wf_execution: WorkflowExecution) -> dict:
    """Notification steps fire-and-forget: send and auto-continue."""
    try:
        if wf_execution.execution:
            notify_approval_required(wf_execution.execution)
    except Exception as exc:
        logger.warning("Notification error on step '%s': %s", step.name, exc)

    step_exec.complete({"notification_sent": True})

    return {
        "can_continue": True,
        "result_data": {"notification_sent": True},
        "message": f"Notification sent for step '{step.name}'",
    }


# ────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────

def _fail(wf_execution: WorkflowExecution, reason: str) -> dict:
    logger.error("WorkflowExecution %s failed: %s", wf_execution.id, reason)
    wf_execution.mark_failed(reason)
    ExecutionLog.objects.create(
        execution=wf_execution.execution,
        step_name=wf_execution.current_step.name if wf_execution.current_step else "unknown",
        step_type="system",
        evaluated_rules=[],
        selected_next_step=None,
        status="failed",
        error_message=reason,
        started_at=timezone.now(),
        ended_at=timezone.now(),
    ) if wf_execution.execution else None
    return {"success": False, "status": "FAILED", "error": reason}


def _log_transition(workflow_execution, step, next_step, evaluated_rules, status):
    """Write a step transition to ExecutionLog for audit trail."""
    if not workflow_execution.execution:
        return
    try:
        ExecutionLog.objects.create(
            execution=workflow_execution.execution,
            step_name=step.name,
            step_type=step.step_type,
            evaluated_rules=evaluated_rules,
            selected_next_step=str(next_step.id) if next_step else None,
            status=status,
            started_at=timezone.now(),
            ended_at=timezone.now(),
        )
    except Exception as exc:
        logger.warning("Failed to write ExecutionLog: %s", exc)


def _send_completion_notifications(wf_execution: WorkflowExecution):
    """Send completion notifications via legacy system."""
    if not wf_execution.execution:
        return
    try:
        notify_completed(wf_execution.execution)
        send_completed_email(wf_execution.execution)
    except Exception as exc:
        logger.warning("Completion notification error: %s", exc)


# ────────────────────────────────────────────────────────────
# Factory helpers (called from views)
# ────────────────────────────────────────────────────────────

def start_workflow(legacy_execution) -> dict:
    """
    Create a WorkflowExecution from a legacy Execution and run it.

    Args:
        legacy_execution: apps.executions.models.Execution instance

    Returns:
        dict result from run_workflow
    """
    wf_exec, created = WorkflowExecution.objects.get_or_create(
        execution=legacy_execution,
        defaults={
            "workflow": legacy_execution.workflow,
            "data": legacy_execution.data or {},
            "triggered_by": legacy_execution.triggered_by,
            "status": "RUNNING",
        },
    )

    if not created and wf_exec.status != "RUNNING":
        wf_exec.status = "RUNNING"
        wf_exec.save(update_fields=["status"])

    return run_workflow(wf_exec, legacy_execution.data)


def resume_after_approval(legacy_execution, user, action: str, comment: str = "") -> dict:
    """
    Record an approval decision and resume graph execution.

    Args:
        legacy_execution: Execution instance
        user:             Approving user
        action:           'approve' or 'reject'
        comment:          Optional comment

    Returns:
        dict result from run_workflow
    """
    try:
        wf_exec = legacy_execution.graph_execution
    except WorkflowExecution.DoesNotExist:
        return {"success": False, "error": "No graph execution found"}

    current_step = wf_exec.current_step
    if not current_step:
        return {"success": False, "error": "No current step"}

    # Store decision in StepExecution
    step_exec, _ = StepExecution.objects.get_or_create(
        workflow_execution=wf_exec,
        step=current_step,
        defaults={"status": "IN_PROGRESS", "execution_count": 0},
    )
    step_exec.result_data = {
        "approval_status": action,
        "approved_by": str(user.id),
        "comment": comment,
    }
    step_exec.save(update_fields=["result_data", "updated_at"])

    # Propagate approval decision into data bag for rule evaluation
    wf_exec.data["approval_status"] = action
    wf_exec.status = "RUNNING"
    wf_exec.save(update_fields=["data", "status"])

    return run_workflow(wf_exec)


def resume_after_task(legacy_execution, task_data: dict = None) -> dict:
    """
    Signal task completion and resume graph execution.

    Args:
        legacy_execution: Execution instance
        task_data:        Data submitted by task assignee

    Returns:
        dict result from run_workflow
    """
    try:
        wf_exec = legacy_execution.graph_execution
    except WorkflowExecution.DoesNotExist:
        return {"success": False, "error": "No graph execution found"}

    current_step = wf_exec.current_step
    if not current_step:
        return {"success": False, "error": "No current step"}

    step_exec, _ = StepExecution.objects.get_or_create(
        workflow_execution=wf_exec,
        step=current_step,
        defaults={"status": "IN_PROGRESS", "execution_count": 0},
    )
    step_exec.result_data = {
        "task_completed": True,
        "task_data": task_data or {},
    }
    step_exec.save(update_fields=["result_data", "updated_at"])

    wf_exec.status = "RUNNING"
    wf_exec.save(update_fields=["status"])

    return run_workflow(wf_exec, task_data)
