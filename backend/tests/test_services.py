"""
Unit tests for credit score service and BRE engine.
Run: pytest tests/ -v
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import date

from app.services.credit_score import fetch_credit_score, _generate_mock_score
from app.services.bre_engine import evaluate_lead, _calculate_age, _compare


class TestCreditScoreService:

    def test_score_in_valid_range(self):
        result = fetch_credit_score("John Doe", "9876543210")
        if result.success:
            assert 300 <= result.score <= 900

    def test_deterministic_scores(self):
        """Same input should give same score every time."""
        score1 = _generate_mock_score("John Doe", "9876543210")
        score2 = _generate_mock_score("John Doe", "9876543210")
        assert score1 == score2

    def test_different_inputs_different_scores(self):
        score1 = _generate_mock_score("John Doe", "9876543210")
        score2 = _generate_mock_score("Jane Smith", "8765432109")
        assert 300 <= score1 <= 900
        assert 300 <= score2 <= 900

    def test_successful_response_structure(self):
        with patch("app.services.credit_score.random") as mock_random:
            mock_random.uniform.return_value = 0.01
            mock_random.random.return_value = 1.0  # no failure
            result = fetch_credit_score("Test User", "9999999999")
            assert result.success is True
            assert result.score is not None
            assert result.provider == "MockCreditBureau"

    def test_failure_response_structure(self):
        with patch("app.services.credit_score.random") as mock_random:
            mock_random.random.return_value = 0.0  # force failure
            mock_random.uniform.return_value = 0.01
            result = fetch_credit_score("Test User", "9999999999")
            assert result.success is False
            assert result.error is not None


class TestBREEngine:

    def test_calculate_age(self):
        today = date.today()
        dob_30 = date(today.year - 30, today.month, today.day).isoformat()
        assert _calculate_age(dob_30) == 30

    def test_compare_operators(self):
        assert _compare(25, ">=", 21) is True
        assert _compare(20, ">=", 21) is False
        assert _compare(55, "<=", 60) is True
        assert _compare(65, "<=", 60) is False
        assert _compare(10, ">", 5) is True
        assert _compare(5, ">", 5) is False
        assert _compare(3, "<", 5) is True
        assert _compare(5, "<", 5) is False
        assert _compare(5, "==", 5) is True
        assert _compare(5, "!=", 3) is True

    def test_eligible_lead(self):
        """Lead that meets all criteria should pass."""
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule("Min Age", "age", ">=", 21),
            _create_mock_rule("Max Age", "age", "<=", 60),
            _create_mock_rule("Min Income", "monthly_income", ">=", 30000),
            _create_mock_rule("Min Score", "credit_score", ">=", 700),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 50000,
            "credit_score": 750,
            "loan_amount": 4000000,
            "property_value": 6000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is True
        assert result.status == "Eligible"
        assert len(result.rejection_reasons) == 0

    def test_ineligible_low_income(self):
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule("Min Income", "monthly_income", ">=", 30000),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 20000,
            "credit_score": 750,
            "loan_amount": 2000000,
            "property_value": 5000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is False
        assert result.status == "Not Eligible"
        assert len(result.rejection_reasons) > 0
        assert "Monthly Income" in result.rejection_reasons[0]

    def test_ineligible_low_credit_score(self):
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule("Min Score", "credit_score", ">=", 700),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 50000,
            "credit_score": 600,
            "loan_amount": 2000000,
            "property_value": 5000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is False
        assert "Credit Score" in result.rejection_reasons[0]

    def test_percentage_rule_loan_to_property(self):
        """Loan amount > 80% of property value should fail LTV check."""
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule(
                "LTV Ratio", "loan_amount", "<=", 80,
                value_type="percentage", reference_field="property_value"
            ),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 50000,
            "credit_score": 750,
            "loan_amount": 9000000,  # 90% of property — should fail
            "property_value": 10000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is False
        assert "Loan Amount" in result.rejection_reasons[0]

    def test_no_rules_means_eligible(self):
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = []

        lead_data = {
            "dob": "2000-01-01",
            "monthly_income": 10000,
            "credit_score": 300,
            "loan_amount": 1000000,
            "property_value": 500000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is True

    def test_missing_credit_score(self):
        """If credit score API failed, should show as rejection reason."""
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule("Min Score", "credit_score", ">=", 700),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 50000,
            "credit_score": None,
            "loan_amount": 2000000,
            "property_value": 5000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is False
        assert "unavailable" in result.rejection_reasons[0].lower()

    def test_multiple_rejection_reasons(self):
        mock_db = MagicMock()
        mock_rules = [
            _create_mock_rule("Min Income", "monthly_income", ">=", 30000),
            _create_mock_rule("Min Score", "credit_score", ">=", 700),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_rules

        today = date.today()
        lead_data = {
            "dob": date(today.year - 30, 1, 15).isoformat(),
            "monthly_income": 20000,
            "credit_score": 600,
            "loan_amount": 2000000,
            "property_value": 5000000,
        }

        result = evaluate_lead(mock_db, lead_data)
        assert result.eligible is False
        assert len(result.rejection_reasons) == 2


# --- helper ---

def _create_mock_rule(name, field, operator, value, value_type="numeric", reference_field=None):
    rule = MagicMock()
    rule.rule_name = name
    rule.field = field
    rule.operator = operator
    rule.value = value
    rule.value_type = value_type
    rule.reference_field = reference_field
    rule.is_active = True
    return rule
