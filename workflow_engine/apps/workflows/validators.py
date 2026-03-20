from django.core.exceptions import ValidationError
from apps.steps.models import Step
from apps.rules.models import Rule

def validate_workflow(workflow):
    """
    Validate a workflow configuration.
    Raises ValidationError if any issues are found.
    
    Rules:
    - Only one step can be marked as start_step
    - Multiple steps can be marked as end_step
    - Each step must have at least one rule (condition-based or default)
    - Rule priority is per-step only (not global)
    """
    steps = list(workflow.steps.all())
    
    # 1. Check for start_step - must have exactly one
    start_steps = [s for s in steps if s.is_start_step]
    
    if not start_steps:
        # No start step defined - try to auto-set from workflow.start_step
        if workflow.start_step:
            # Workflow.start_step is set, ensure it's marked as is_start_step
            if workflow.start_step not in steps:
                raise ValidationError("Start step must belong to the workflow.")
        else:
            raise ValidationError("Workflow must have exactly one step marked as start step.")
    
    if len(start_steps) > 1:
        raise ValidationError("Only one step can be marked as the start step.")
    
    # 2. Validate that each step has at least one rule
    for step in steps:
        rules = step.rules.all()
        if not rules.exists():
            raise ValidationError(
                f"Step '{step.name}' has no rules defined. "
                f"Each step must have at least one rule (condition-based or default) to define the next step."
            )
        
        # 3. Rules reference valid steps (next_step must belong to workflow)
        for rule in rules:
            if rule.next_step and rule.next_step.workflow != workflow:
                raise ValidationError(f"Rule in step '{step.name}' references a step '{rule.next_step.name}' from a different workflow.")
        
        # 4. Only one default rule per step (check both is_default and rule_type)
        default_rules_count = rules.filter(is_default=True).count()
        default_type_count = rules.filter(rule_type='DEFAULT').count()
        total_default = max(default_rules_count, default_type_count)
        
        if total_default > 1:
            raise ValidationError(f"Step '{step.name}' has more than one default rule.")
        
        # 5. Validate that priority is unique per step
        priorities = [r.priority for r in rules]
        if len(priorities) != len(set(priorities)):
            raise ValidationError(
                f"Step '{step.name}' has rules with duplicate priority values. "
                f"Rule priority should be unique within each step."
            )
        
        # 6. Only one rule allowed between same source-target pair
        next_step_ids = [r.next_step_id for r in rules if r.next_step_id]
        if len(next_step_ids) != len(set(next_step_ids)):
            raise ValidationError(
                f"Step '{step.name}' has multiple rules pointing to the same next step. "
                f"Only one rule (either condition-based or default) is allowed between two steps."
            )
            
        # 5. Rule operators match field type
        # This requires checking field types against operators.
        workflow_fields = {field.name: field.field_type for field in workflow.fields.all()}
        
        for rule in step.rules.all():
            if rule.is_default:
                continue
            
            conditions = rule.get_conditions_list()
            for condition in conditions:
                field_name = condition.get("field")
                operator = condition.get("operator")
                
                if field_name not in workflow_fields:
                    raise ValidationError(f"Rule in step '{step.name}' references non-existent field '{field_name}'.")
                
                field_type = workflow_fields[field_name]
                
                # Basic operator/field type compatibility check
                numeric_ops = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
                text_ops = ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with']
                boolean_ops = ['is_true', 'is_false']
                date_ops = ['before', 'after']
                
                if field_type == 'number' and operator not in numeric_ops:
                    raise ValidationError(f"Field '{field_name}' (number) cannot use operator '{operator}'.")
                elif field_type == 'text' and operator not in text_ops:
                    # Some overlap might be okay, but let's be strict for now or allow 'eq'
                    if operator not in ['eq', 'neq'] and operator not in text_ops:
                        raise ValidationError(f"Field '{field_name}' (text) cannot use operator '{operator}'.")
                elif field_type == 'boolean' and operator not in boolean_ops:
                    raise ValidationError(f"Field '{field_name}' (boolean) cannot use operator '{operator}'.")
                elif field_type == 'date' and operator not in date_ops:
                    if operator not in ['eq', 'neq'] and operator not in date_ops:
                        raise ValidationError(f"Field '{field_name}' (date) cannot use operator '{operator}'.")

    return True
