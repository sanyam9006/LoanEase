from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime

from app.core.database import Base


class BRERule(Base):
    """
    BRE rule stored in DB. Supports numeric comparisons (age >= 21)
    and percentage-based ones (loan_amount <= 80% of property_value).
    """
    __tablename__ = "bre_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rule_name = Column(String(100), nullable=False)
    field = Column(String(50), nullable=False)       # age, monthly_income, credit_score, loan_amount
    operator = Column(String(10), nullable=False)     # >=, <=, >, <, ==, !=
    value = Column(Float, nullable=False)
    value_type = Column(String(20), default="numeric")  # numeric or percentage
    reference_field = Column(String(50), nullable=True)  # used for percentage rules (e.g. property_value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<BRERule(id={self.id}, rule='{self.rule_name}', field='{self.field}' {self.operator} {self.value})>"
