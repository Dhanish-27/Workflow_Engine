import uuid
import json
from django.db import models
from django.core.exceptions import ValidationError


class RuleCondition(models.Model):
    """
    Model to store individual conditions for a rule.
    Supports multiple conditions per rule with AND/OR logical operators.
    """
    
    OPERATORS = (
        ('gt', 'Greater Than'),
        ('lt', 'Less Than'),
        ('gte', 'Greater Than or Equal'),
        ('lte', 'Less Than or Equal'),
        ('eq', 'Equal'),
        ('neq', 'Not Equal'),
        ('equals', 'Equals (case-insensitive)'),
        ('not_equals', 'Not Equals (case-insensitive)'),
        ('contains', 'Contains'),
        ('starts_with', 'Starts With'),
        ('ends_with', 'Ends With'),
        ('is_true', 'Is True'),
        ('is_false', 'Is False'),
        ('before', 'Before'),
        ('after', 'After'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    rule = models.ForeignKey(
        'rules.Rule',
        on_delete=models.CASCADE,
        related_name='conditions'
    )
    
    field_name = models.CharField(max_length=255, help_text='Field name to evaluate')
    
    operator = models.CharField(
        max_length=20,
        choices=OPERATORS,
        help_text='Comparison operator'
    )
    
    value = models.JSONField(help_text='Expected value for comparison')
    
    order = models.IntegerField(default=0, help_text='Order of condition within the rule')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.field_name} {self.operator} {self.value}"


class Rule(models.Model):
    
    LOGICAL_OPERATORS = (
        ('AND', 'AND'),
        ('OR', 'OR'),
    )
    
    # Rule types: CONDITION - evaluated based on conditions, DEFAULT - fallback when no conditions match
    RULE_TYPES = (
        ('CONDITION', 'Condition Based'),
        ('DEFAULT', 'Default Next Step'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255, blank=True, default="")

    step = models.ForeignKey(
        "steps.Step",
        on_delete=models.CASCADE,
        related_name="rules"
    )
    
    # Rule type: CONDITION (conditions determine if this rule applies) or DEFAULT (fallback)
    rule_type = models.CharField(
        max_length=20,
        choices=RULE_TYPES,
        default='CONDITION',
        help_text="Condition Based: evaluated when conditions are true. Default Next Step: used when no conditions match."
    )

    # Store conditions as JSON string (legacy support)
    # Format: {"conditions": [{"field": "amount", "operator": ">", "value": 1000}], "logical_operator": "AND"}
    condition = models.TextField(blank=True, default='')
    
    # New field for logical operator (AND/OR)
    logical_operator = models.CharField(
        max_length=3,
        choices=LOGICAL_OPERATORS,
        default='AND',
        help_text='Logical operator to combine multiple conditions'
    )

    next_step = models.ForeignKey(
        "steps.Step",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_rules"
    )

    priority = models.IntegerField(
        default=1,
        help_text="Priority of this rule within the step. Lower numbers are evaluated first."
    )

    is_default = models.BooleanField(
        default=False, 
        help_text="Use this rule when no other rules match (fallback rule)"
    )
    
    # Mark as end step - when this rule's next_step is reached, it can end the workflow
    is_end_rule = models.BooleanField(
        default=False,
        help_text="Mark this as an end rule - reaching this rule's next_step completes the workflow"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority"]

    def __str__(self):
        return self.name or self.condition[:50]
    
    def clean(self):
        """Validate the rule"""
        super().clean()
        # Check for multiple default rules per step
        if self.is_default:
            existing_default = Rule.objects.filter(step=self.step, is_default=True).exclude(pk=self.pk)
            if existing_default.exists():
                raise ValidationError({'is_default': 'Only one default rule is allowed per step.'})
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def evaluate_conditions(self, execution_data):
        """
        Evaluate conditions using the new RuleCondition model.
        Falls back to legacy JSON conditions if no RuleCondition objects exist.
        
        Args:
            execution_data: Dict of {field_name: value} from workflow execution
            
        Returns:
            bool: True if rule matches, False otherwise
        """
        # Default rules always match
        if self.is_default:
            return True
        
        # Try to use new RuleCondition model first
        conditions = self.conditions.all()
        
        if conditions.exists():
            # Use new RuleCondition model
            return self._evaluate_rule_conditions(conditions, execution_data)
        elif self.condition:
            # Fall back to legacy JSON conditions
            return self.evaluate(execution_data)
        else:
            # No conditions defined
            return False
    
    def _evaluate_rule_conditions(self, conditions, execution_data):
        """
        Evaluate conditions from RuleCondition model.
        
        Args:
            conditions: QuerySet of RuleCondition objects
            execution_data: Dict of {field_name: value}
            
        Returns:
            bool: True if rule matches
        """
        from .services.rule_engine import evaluate_condition
        from apps.workflows.models import WorkflowField
        
        results = []
        
        # Build a mapping of field_id -> field_name for lookup
        # The rule's conditions might store Field IDs while execution_data uses Field Names
        field_id_to_name = {}
        field_name_to_id = {}
        
        # Try to get workflow from step
        workflow = None
        if hasattr(self.step, 'workflow'):
            workflow = self.step.workflow
        elif hasattr(self.step, 'workflow_id'):
            from apps.workflows.models import Workflow
            try:
                workflow = Workflow.objects.get(id=self.step.workflow_id)
            except Workflow.DoesNotExist:
                pass
        
        if workflow:
            # Get all workflow fields to build mapping
            workflow_fields = WorkflowField.objects.filter(workflow=workflow)
            for wf in workflow_fields:
                field_id_to_name[str(wf.id)] = wf.name
                field_name_to_id[wf.name] = str(wf.id)
        
        for condition in conditions:
            field_name = condition.field_name
            
            # If field_name looks like a UUID, try to translate it to actual field name
            # Check if the stored field_name is a UUID that needs translation
            if field_name and len(field_name) == 36 and '-' in field_name:
                # It's likely a UUID, try to look up the field name
                if field_name in field_id_to_name:
                    field_name = field_id_to_name[field_name]
                else:
                    # Try to look up by ID directly
                    try:
                        wf = WorkflowField.objects.get(id=field_name)
                        field_name = wf.name
                    except WorkflowField.DoesNotExist:
                        pass
            
            # Get the actual value from execution_data
            actual_value = execution_data.get(field_name)
            
            # If not found by field_name, try by field_id
            if actual_value is None and field_name in field_name_to_id:
                actual_value = execution_data.get(field_name_to_id[field_name])
            
            result = evaluate_condition(condition, actual_value)
            results.append(result)
        
        if not results:
            return False
        
        # Combine results based on logical operator
        if self.logical_operator == "OR":
            return any(results)
        else:  # AND (default)
            return all(results)
    
    def get_logical_operator(self):
        """Get the logical operator (AND/OR) for combining conditions"""
        # Use the new field first, then fall back to legacy JSON
        if self.logical_operator:
            return self.logical_operator
        
        data = self.get_conditions()
        return data.get("logical_operator", "AND")

    def get_conditions(self):
        """Parse and return conditions from JSON string"""
        if not self.condition:
            return {"conditions": [], "logical_operator": "AND"}
        
        try:
            if isinstance(self.condition, str):
                return json.loads(self.condition)
            return self.condition
        except json.JSONDecodeError:
            # Fallback for old format (plain string conditions)
            return {"conditions": [], "logical_operator": "AND"}

    def get_conditions_list(self):
        """Get just the list of conditions"""
        data = self.get_conditions()
        return data.get("conditions", [])

    def get_logical_operator(self):
        """Get the logical operator (AND/OR) for combining conditions"""
        data = self.get_conditions()
        return data.get("logical_operator", "AND")

    def evaluate(self, field_values):
        """
        Evaluate if this rule matches the given field values.
        
        Args:
            field_values: Dict of {field_name: value}
            
        Returns:
            bool: True if rule matches, False otherwise
        """
        # Default rules always match
        if self.is_default:
            return True
        
        conditions = self.get_conditions_list()
        
        if not conditions:
            return False
        
        results = []
        for condition in conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")
            
            if not all([field, operator]):
                continue
            
            # Get the actual value from field_values
            actual_value = field_values.get(field)
            
            # Evaluate the condition
            result = self._evaluate_condition(actual_value, operator, value)
            results.append(result)
        
        if not results:
            return False
        
        # Combine results based on logical operator
        logical_op = self.get_logical_operator()
        
        if logical_op == "OR":
            return any(results)
        else:  # AND
            return all(results)

    def _evaluate_condition(self, actual_value, operator, expected_value):
        """
        Evaluate a single condition.
        
        Args:
            actual_value: The actual value from the workflow execution
            operator: The operator (eq, neq, gt, gte, lt, lte, equals, not_equals, contains, etc.)
            expected_value: The expected value from the rule
            
        Returns:
            bool: True if condition matches
        """
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
        switch = {
            # Number operators
            'eq': lambda: actual_value == expected_value,
            'neq': lambda: actual_value != expected_value,
            'gt': lambda: actual_value > expected_value,
            'gte': lambda: actual_value >= expected_value,
            'lt': lambda: actual_value < expected_value,
            'lte': lambda: actual_value <= expected_value,
            
            # Text operators
            'equals': lambda: str(actual_value).lower() == str(expected_value).lower(),
            'not_equals': lambda: str(actual_value).lower() != str(expected_value).lower(),
            'contains': lambda: str(expected_value).lower() in str(actual_value).lower(),
            'starts_with': lambda: str(actual_value).lower().startswith(str(expected_value).lower()),
            'ends_with': lambda: str(actual_value).lower().endswith(str(expected_value).lower()),
            
            # Boolean operators
            'is_true': lambda: actual_value is True or str(actual_value).lower() == 'true',
            'is_false': lambda: actual_value is False or str(actual_value).lower() == 'false',
            
            # Date operators
            'before': lambda: self._compare_dates(actual_value, expected_value) < 0,
            'after': lambda: self._compare_dates(actual_value, expected_value) > 0,
        }
        
        evaluate_func = switch.get(operator)
        if evaluate_func:
            try:
                return evaluate_func()
            except Exception:
                return False
        
        return False

    def _compare_dates(self, date1, date2):
        """
        Compare two dates.
        
        Args:
            date1: First date (can be string or date object)
            date2: Second date (can be string or date object)
            
        Returns:
            int: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
        """
        from datetime import datetime
        
        # Try to parse dates
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

    def get_condition_summary(self):
        """
        Get a human-readable summary of the conditions.
        
        Returns:
            str: A summary string of the conditions
        """
        conditions = self.get_conditions_list()
        
        if not conditions:
            return "No conditions"
        
        if self.is_default:
            return "Default rule (matches all)"
        
        parts = []
        for i, cond in enumerate(conditions):
            field = cond.get("field", "")
            operator = cond.get("operator", "")
            value = cond.get("value", "")
            logic = cond.get("logic", "AND")
            
            # Format the condition
            op_symbols = {
                'eq': '==',
                'neq': '!=',
                'gt': '>',
                'gte': '>=',
                'lt': '<',
                'lte': '<=',
                'equals': '=',
                'not_equals': '≠',
                'contains': 'contains',
                'starts_with': 'starts with',
                'ends_with': 'ends with',
                'is_true': 'is true',
                'is_false': 'is false',
                'before': 'before',
                'after': 'after',
            }
            
            op = op_symbols.get(operator, operator)
            cond_str = f"{field} {op} {value}"
            
            if i == 0:
                parts.append(cond_str)
            else:
                parts.append(f"{logic} {cond_str}")
        
        return " ".join(parts)
