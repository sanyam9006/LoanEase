from pydantic import BaseModel, Field
from typing import Optional, List


class BRERuleCreate(BaseModel):
    """Schema for creating a new BRE rule."""

    rule_name: str = Field(..., min_length=2, max_length=100)
    field: str = Field(..., description="Field to evaluate: age, monthly_income, credit_score, loan_amount")
    operator: str = Field(..., description="Comparison operator: >=, <=, >, <, ==, !=")
    value: float = Field(..., description="Value or percentage to compare against")
    value_type: str = Field(default="numeric", description="numeric or percentage")
    reference_field: Optional[str] = Field(
        default=None,
        description="Reference field for percentage comparisons (e.g., property_value)",
    )
    is_active: bool = Field(default=True)


class BRERuleUpdate(BaseModel):
    """Schema for updating an existing BRE rule."""

    rule_name: Optional[str] = None
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[float] = None
    value_type: Optional[str] = None
    reference_field: Optional[str] = None
    is_active: Optional[bool] = None


class BRERuleResponse(BaseModel):
    """Schema for BRE rule API response."""

    id: int
    rule_name: str
    field: str
    operator: str
    value: float
    value_type: str
    reference_field: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class BRERuleListResponse(BaseModel):
    """List of BRE rules."""

    rules: List[BRERuleResponse]
    total: int
