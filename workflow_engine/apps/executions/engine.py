from apps.rules.models import Rule


def get_next_step(step, data):
    """
    Get the next step based on rule evaluation.
    
    Args:
        step: Step object with related rules
        data: Dict of field values to evaluate rules against
        
    Returns:
        tuple: (next_step, evaluated_rules) where:
            - next_step: The next Step object to transition to, or None
            - evaluated_rules: List of dicts with rule_id and result
    """
    rules = step.rules.all().order_by("priority")
    
    results = []
    
    for rule in rules:
        # Default rules always match - use as fallback
        if rule.is_default:
            return rule.next_step, results
        
        # Use the safe evaluate method from rules/models.py
        matches = rule.evaluate(data)
        results.append({"rule_id": str(rule.id), "result": matches})
        
        if matches:
            return rule.next_step, results
    
    # No rules matched - return None
    return None, results
