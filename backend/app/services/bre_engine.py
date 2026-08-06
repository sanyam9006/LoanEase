"""
Business Rule Engine (BRE) — evaluates loan eligibility dynamically.

All rules come from the bre_rules DB table (nothing hardcoded).
Supports numeric comparisons (age >= 21) and percentage-based ones
(loan_amount <= 80% of property_value).
"""

from datetime import date, datetime
from typing import List, Tuple, Dict, Any, Optional
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.bre_rule import BRERule


@dataclass
class BREResult:
    eligible: bool
    status: str  # "Eligible" or "Not Eligible"
    rejection_reasons: List[str]
    rules_evaluated: int
    rules_passed: int
    rules_failed: int


def _calculate_age(dob_str: str) -> int:
    """Get age from DOB string (YYYY-MM-DD format)."""
    dob = date.fromisoformat(dob_str)
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age


def _get_field_value(field: str, lead_data: Dict[str, Any]) -> Optional[float]:
    """Pull the right value from lead data based on field name."""
    field_mapping = {
        "age": lambda d: float(_calculate_age(d["dob"])),
        "monthly_income": lambda d: float(d["monthly_income"]),
        "credit_score": lambda d: float(d["credit_score"]) if d.get("credit_score") else None,
        "loan_amount": lambda d: float(d["loan_amount"]),
        "property_value": lambda d: float(d["property_value"]),
    }

    getter = field_mapping.get(field.lower())
    if getter is None:
        return None
    return getter(lead_data)


def _compare(actual: float, operator: str, target: float) -> bool:
    """Run a comparison. Supports >=, <=, >, <, ==, !="""
    operations = {
        ">=": lambda a, b: a >= b,
        "<=": lambda a, b: a <= b,
        ">": lambda a, b: a > b,
        "<": lambda a, b: a < b,
        "==": lambda a, b: a == b,
        "!=": lambda a, b: a != b,
    }
    op_func = operations.get(operator)
    if op_func is None:
        raise ValueError(f"Unsupported operator: {operator}")
    return op_func(actual, target)


def _get_rejection_message(rule: BRERule, actual_value: float, target_value: float) -> str:
    """Build a human-readable rejection reason string."""
    field_labels = {
        "age": "Age",
        "monthly_income": "Monthly Income",
        "credit_score": "Credit Score",
        "loan_amount": "Loan Amount",
        "property_value": "Property Value",
    }

    field_label = field_labels.get(rule.field, rule.field)

    # percentage-based rule (e.g. LTV ratio)
    if rule.value_type == "percentage" and rule.reference_field:
        ref_label = field_labels.get(rule.reference_field, rule.reference_field)
        return (
            f"{field_label} ({actual_value:,.0f}) exceeds {rule.value:.0f}% "
            f"of {ref_label} ({target_value:,.0f}). "
            f"Maximum allowed: {target_value:,.0f}"
        )

    operator_text = {
        ">=": "below minimum requirement",
        "<=": "exceeds maximum limit",
        ">": "does not meet minimum requirement",
        "<": "exceeds limit",
        "==": "does not match required value",
        "!=": "matches excluded value",
    }

    action = operator_text.get(rule.operator, "does not meet criteria")
    return f"{field_label} ({actual_value:,.0f}) {action}. Required: {rule.operator} {target_value:,.0f}"


def evaluate_lead(db: Session, lead_data: Dict[str, Any]) -> BREResult:
    """
    Run all active BRE rules against a lead's data.
    Returns eligibility status + list of reasons if rejected.
    """
    # fetch rules from DB every time (so admin changes take effect immediately)
    rules = db.query(BRERule).filter(BRERule.is_active == True).all()

    if not rules:
        return BREResult(
            eligible=True,
            status="Eligible",
            rejection_reasons=[],
            rules_evaluated=0,
            rules_passed=0,
            rules_failed=0,
        )

    rejection_reasons: List[str] = []
    rules_passed = 0
    rules_failed = 0

    for rule in rules:
        actual_value = _get_field_value(rule.field, lead_data)

        if actual_value is None:
            # credit score might be None if API failed
            if rule.field == "credit_score":
                rejection_reasons.append(
                    "Credit Score unavailable — unable to evaluate credit eligibility"
                )
                rules_failed += 1
                continue
            continue

        # figure out what we're comparing against
        if rule.value_type == "percentage" and rule.reference_field:
            # e.g. loan_amount <= 80% of property_value
            reference_value = _get_field_value(rule.reference_field, lead_data)
            if reference_value is None:
                continue
            target_value = (rule.value / 100.0) * reference_value
        else:
            target_value = rule.value

        # check the rule
        if _compare(actual_value, rule.operator, target_value):
            rules_passed += 1
        else:
            rules_failed += 1
            rejection_reasons.append(
                _get_rejection_message(rule, actual_value, target_value)
            )

    eligible = len(rejection_reasons) == 0
    return BREResult(
        eligible=eligible,
        status="Eligible" if eligible else "Not Eligible",
        rejection_reasons=rejection_reasons,
        rules_evaluated=rules_passed + rules_failed,
        rules_passed=rules_passed,
        rules_failed=rules_failed,
    )
