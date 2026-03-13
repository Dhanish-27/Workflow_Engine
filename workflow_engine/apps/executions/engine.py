import ast


def evaluate_condition(condition, data):

    try:
        expression = condition

        for key, value in data.items():

            if isinstance(value, str):
                value = f"'{value}'"

            expression = expression.replace(key, str(value))

        return eval(expression)

    except Exception:
        return False


def get_next_step(step, data):

    rules = step.rules.all().order_by("priority")

    results = []

    for rule in rules:

        if rule.condition == "DEFAULT":
            return rule.next_step, results

        result = evaluate_condition(rule.condition, data)

        results.append(
            {"rule": rule.condition, "result": result}
        )

        if result:
            return rule.next_step, results

    return None, results