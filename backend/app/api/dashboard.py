"""Dashboard stats API."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lead import Lead
from app.models.user import User
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard numbers — totals, avg score, charts data."""
    total_leads = db.query(Lead).count()
    eligible_leads = db.query(Lead).filter(Lead.bre_status == "Eligible").count()
    rejected_leads = db.query(Lead).filter(Lead.bre_status == "Not Eligible").count()
    pending_leads = db.query(Lead).filter(Lead.bre_status == "pending").count()

    avg_score = db.query(func.avg(Lead.credit_score)).filter(
        Lead.credit_score.isnot(None)
    ).scalar()

    # loan type breakdown (for pie chart)
    loan_types = (
        db.query(Lead.loan_type, func.count(Lead.id))
        .group_by(Lead.loan_type)
        .all()
    )
    loan_type_breakdown = {lt: count for lt, count in loan_types}

    # monthly lead volume (for bar chart)
    monthly_data = (
        db.query(
            func.strftime("%Y-%m", Lead.created_at).label("month"),
            func.count(Lead.id).label("count"),
        )
        .group_by(func.strftime("%Y-%m", Lead.created_at))
        .order_by(func.strftime("%Y-%m", Lead.created_at))
        .limit(12)
        .all()
    )
    monthly_leads = [{"month": m, "count": c} for m, c in monthly_data]

    return DashboardStats(
        total_leads=total_leads,
        eligible_leads=eligible_leads,
        rejected_leads=rejected_leads,
        pending_leads=pending_leads,
        average_credit_score=round(avg_score, 1) if avg_score else None,
        loan_type_breakdown=loan_type_breakdown,
        monthly_leads=monthly_leads,
    )
