from pydantic import BaseModel
from typing import Optional


class DashboardStats(BaseModel):
    """Schema for admin dashboard statistics."""

    total_leads: int
    eligible_leads: int
    rejected_leads: int
    pending_leads: int
    average_credit_score: Optional[float] = None

    # Extra chart data
    loan_type_breakdown: dict = {}  # {"Home Loan": 5, "LAP": 3}
    monthly_leads: list = []  # [{month: "Jan", count: 5}, ...]
