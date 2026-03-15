from django.core.exceptions import ValidationError
from apps.steps.models import Step
from apps.rules.models import Rule

def validate_workflow(workflow):
    """
    Validate a workflow configuration.
    Raises ValidationError if any issues are found.
    """
    # 1. Workflow has start_step - if not, try to auto-set it to the first step
    if not workflow.start_step:
        first_step = workflow.steps.all().order_by('order').first()
        if first_step:
            workflow.start_step = first_step
            # We don't save here because validation is usually called during clean() before save()
        else:
            raise ValidationError("Workflow must have at least one step.")
    
    # 2. Steps belong to workflow
    steps = workflow.steps.all()
    if workflow.start_step not in steps:
        raise ValidationError("Start step must belong to the workflow.")
    
    for step in steps:
        # 3. Rules reference valid steps (next_step must belong to workflow)
        for rule in step.rules.all():
            if rule.next_step and rule.next_step.workflow != workflow:
                raise ValidationError(f"Rule in step '{step.name}' references a step '{rule.next_step.name}' from a different workflow.")
        
        # 4. Only one default rule per step
        default_rules_count = step.rules.filter(is_default=True).count()
        if default_rules_count > 1:
            raise ValidationError(f"Step '{step.name}' has more than one default rule.")
            
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
