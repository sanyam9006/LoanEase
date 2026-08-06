from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date
import re


class LeadCreate(BaseModel):
    """Input schema for new loan application."""

    full_name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., min_length=10, max_length=15)
    email: str = Field(...)
    dob: str = Field(...)  # YYYY-MM-DD
    city: str = Field(..., min_length=2, max_length=50)
    pincode: str = Field(..., min_length=6, max_length=6)

    loan_type: str = Field(...)
    employment_type: str = Field(...)
    monthly_income: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    property_value: float = Field(..., gt=0)

    consent: bool = Field(...)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v):
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Invalid Indian mobile number (must be 10 digits starting with 6-9)")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v):
        if not re.match(r"^\d{6}$", v):
            raise ValueError("Pincode must be exactly 6 digits")
        return v

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, v):
        try:
            dob_date = date.fromisoformat(v)
            if dob_date >= date.today():
                raise ValueError("Date of birth must be in the past")
        except ValueError as e:
            if "Date of birth" in str(e):
                raise
            raise ValueError("Invalid date format (use YYYY-MM-DD)")
        return v

    @field_validator("loan_type")
    @classmethod
    def validate_loan_type(cls, v):
        valid = ["Home Loan", "Loan Against Property"]
        if v not in valid:
            raise ValueError(f"Loan type must be one of: {valid}")
        return v

    @field_validator("employment_type")
    @classmethod
    def validate_employment_type(cls, v):
        valid = ["Salaried", "Self Employed"]
        if v not in valid:
            raise ValueError(f"Employment type must be one of: {valid}")
        return v

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v):
        if not v:
            raise ValueError("Consent is mandatory for loan processing")
        return v


class LeadResponse(BaseModel):
    """API response after creating a lead."""
    status: str
    lead_id: int
    credit_score: Optional[int] = None
    bre_status: str
    rejection_reasons: Optional[List[str]] = None
    message: Optional[str] = None

    model_config = {"from_attributes": True}


class LeadDetail(BaseModel):
    """Full lead info for admin table."""
    id: int
    full_name: str
    mobile: str
    email: str
    dob: str
    city: str
    pincode: str
    loan_type: str
    employment_type: str
    monthly_income: float
    loan_amount: float
    property_value: float
    credit_score: Optional[int] = None
    credit_score_status: Optional[str] = None
    bre_status: str
    rejection_reasons: Optional[List[str]] = None
    consent: bool
    created_at: str

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    """Paginated lead list."""
    leads: List[LeadDetail]
    total: int
    page: int
    per_page: int
    total_pages: int
