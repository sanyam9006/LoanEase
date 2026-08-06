from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # customer info
    full_name = Column(String(100), nullable=False)
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(100), nullable=False)
    dob = Column(String(10), nullable=False)  # YYYY-MM-DD
    city = Column(String(50), nullable=False)
    pincode = Column(String(10), nullable=False)

    # loan info
    loan_type = Column(String(30), nullable=False)
    employment_type = Column(String(30), nullable=False)
    monthly_income = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    property_value = Column(Float, nullable=False)

    # credit score from API
    credit_score = Column(Integer, nullable=True)
    credit_score_status = Column(String(20), default="pending")

    # BRE evaluation result
    bre_status = Column(String(20), default="pending")
    rejection_reasons = Column(JSON, nullable=True)

    consent = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<Lead(id={self.id}, name='{self.full_name}', status='{self.bre_status}')>"
