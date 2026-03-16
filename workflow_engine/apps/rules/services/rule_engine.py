"""
Rule Engine - Evaluate rules and conditions for workflow execution.
"""
from datetime import datetime


def evaluate_condition(condition, execution_data):
    """
    Evaluate a single condition against execution data.
    
    Args:
        condition: RuleCondition object or dict with field_name, operator, value
        execution_data: The actual value to evaluate against
        
    Returns:
        bool: True if condition matches, False otherwise
    """
    # Handle both RuleCondition objects and dicts
    if hasattr(condition, 'field_name'):
        field_name = condition.field_name
        operator = condition.operator
        expected_value = condition.value
        actual_value = execution_data
    else:
        field_name = condition.get('field_name') or condition.get('field')
        operator = condition.get('operator')
        expected_value = condition.get('value')
        actual_value = execution_data
    
    if not all([field_name, operator]):
        return False
    
    # Handle None values
    if actual_value is None:
        return False
    
    # Convert both to float if possible for numeric operators
    numeric_ops = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
    if operator in numeric_ops:
        try:
            actual_value = float(actual_value)
            expected_value = float(expected_value)
        except (ValueError, TypeError):
            pass
    
    # Evaluate based on operator
    if operator == 'eq':
        return actual_value == expected_value
    elif operator == 'neq':
        return actual_value != expected_value
    elif operator == 'gt':
        return actual_value > expected_value
    elif operator == 'gte':
        return actual_value >= expected_value
    elif operator == 'lt':
        return actual_value < expected_value
    elif operator == 'lte':
        return actual_value <= expected_value
    elif operator == 'equals':
        return str(actual_value).lower() == str(expected_value).lower()
    elif operator == 'not_equals':
        return str(actual_value).lower() != str(expected_value).lower()
    elif operator == 'contains':
        return str(expected_value).lower() in str(actual_value).lower()
    elif operator == 'starts_with':
        return str(actual_value).lower().startswith(str(expected_value).lower())
    elif operator == 'ends_with':
        return str(actual_value).lower().endswith(str(expected_value).lower())
    elif operator == 'is_true':
        return actual_value is True or str(actual_value).lower() == 'true'
    elif operator == 'is_false':
        return actual_value is False or str(actual_value).lower() == 'false'
    elif operator == 'before':
        return _compare_dates(actual_value, expected_value) < 0
    elif operator == 'after':
        return _compare_dates(actual_value, expected_value) > 0
    
    return False


def _compare_dates(date1, date2):
    """
    Compare two dates.
    
    Args:
        date1: First date (can be string or date object)
        date2: Second date (can be string or date object)
        
    Returns:
        int: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
    """
    formats = ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%d %H:%M:%S']
    
    d1 = None
    d2 = None
    
    for fmt in formats:
        try:
            if isinstance(date1, str):
                d1 = datetime.strptime(date1, fmt)
            else:
                d1 = date1
            break
        except (ValueError, TypeError):
            continue
    
    for fmt in formats:
        try:
            if isinstance(date2, str):
                d2 = datetime.strptime(date2, fmt)
            else:
                d2 = date2
            break
        except (ValueError, TypeError):
            continue
    
    if d1 is None or d2 is None:
        return 0
    
    if d1 < d2:
        return -1
    elif d1 > d2:
        return 1
    return 0


def evaluate_rule(rule, execution_data):
    """
    Evaluate a single rule using the Rule's logical_operator (AND/OR).
    
    Args:
        rule: Rule object with conditions
        execution_data: Dict of {field_name: value} from workflow execution
        
    Returns:
        bool: True if rule matches, False otherwise
    """
    # Default rules always match
    if rule.is_default:
        return True
    
    # Try to use new RuleCondition model first
    conditions = rule.conditions.all()
    
    if conditions.exists():
        # Use new RuleCondition model
        return _evaluate_conditions_with_operator(conditions, execution_data, rule.logical_operator)
    elif rule.condition:
        # Fall back to legacy JSON conditions
        return _evaluate_legacy_conditions(rule, execution_data)
    else:
        # No conditions defined
        return False


def _evaluate_conditions_with_operator(conditions, execution_data, logical_operator):
    """
    Evaluate conditions using the specified logical operator.
    
    Args:
        conditions: QuerySet of RuleCondition objects
        execution_data: Dict of {field_name: value}
        logical_operator: 'AND' or 'OR'
        
    Returns:
        bool: True if rule matches
    """
    results = []
    for condition in conditions:
        actual_value = execution_data.get(condition.field_name)
        result = evaluate_condition(condition, actual_value)
        results.append(result)
    
    if not results:
        return False
    
    if logical_operator == "OR":
        return any(results)
    else:  # AND (default)
        return all(results)


def _evaluate_legacy_conditions(rule, execution_data):
    """
    Evaluate conditions from legacy JSON field.
    
    Args:
        rule: Rule object with condition JSON field
        execution_data: Dict of {field_name: value}
        
    Returns:
        bool: True if rule matches
    """
    import json
    
    try:
        if isinstance(rule.condition, str):
            conditions_data = json.loads(rule.condition)
        else:
            conditions_data = rule.condition
    except (json.JSONDecodeError, TypeError):
        return False
    
    conditions = conditions_data.get("conditions", [])
    logical_operator = conditions_data.get("logical_operator", "AND")
    
    if not conditions:
        return False
    
    results = []
    for condition in conditions:
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if not all([field, operator]):
            continue
        
        actual_value = execution_data.get(field)
        result = evaluate_condition(condition, actual_value)
        results.append(result)
    
    if not results:
        return False
    
    if logical_operator == "OR":
        return any(results)
    else:  # AND
        return all(results)


def evaluate_rules(step, execution_data):
    """
    Evaluate all rules for a step and return the next step if a rule matches.
    
    Args:
        step: Step object with related rules
        execution_data: Dict of {field_name: value} from workflow execution
        
    Returns:
        Step or None: The next step to transition to, or None if no rules match
    """
    from apps.rules.models import Rule
    
    # Get all rules for this step, ordered by priority
    rules = Rule.objects.filter(step=step).order_by('priority')
    
    for rule in rules:
        if evaluate_rule(rule, execution_data):
            return rule.next_step
    
    return None


def get_matching_rule(step, execution_data):
    """
    Get the first matching rule for a step.
    
    Args:
        step: Step object with related rules
        execution_data: Dict of {field_name: value} from workflow execution
        
    Returns:
        Rule or None: The first matching rule, or None if no rules match
    """
    from apps.rules.models import Rule
    
    # Get all rules for this step, ordered by priority
    rules = Rule.objects.filter(step=step).order_by('priority')
    
    for rule in rules:
        if evaluate_rule(rule, execution_data):
            return rule
    
    return None
