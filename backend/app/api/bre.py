"""BRE rules CRUD — admin can add/edit/delete rules from here."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.bre_rule import BRERule
from app.models.user import User
from app.schemas.bre import BRERuleCreate, BRERuleUpdate, BRERuleResponse, BRERuleListResponse

router = APIRouter(prefix="/api/bre", tags=["BRE Rules"])


@router.get("/rules", response_model=BRERuleListResponse)
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all BRE rules."""
    rules = db.query(BRERule).order_by(BRERule.id).all()

    rule_list = []
    for rule in rules:
        rule_list.append(
            BRERuleResponse(
                id=rule.id,
                rule_name=rule.rule_name,
                field=rule.field,
                operator=rule.operator,
                value=rule.value,
                value_type=rule.value_type,
                reference_field=rule.reference_field,
                is_active=rule.is_active,
                created_at=rule.created_at.isoformat() if rule.created_at else "",
                updated_at=rule.updated_at.isoformat() if rule.updated_at else "",
            )
        )

    return BRERuleListResponse(rules=rule_list, total=len(rule_list))


@router.post("/rules", response_model=BRERuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    rule_data: BRERuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new BRE rule."""
    new_rule = BRERule(
        rule_name=rule_data.rule_name,
        field=rule_data.field,
        operator=rule_data.operator,
        value=rule_data.value,
        value_type=rule_data.value_type,
        reference_field=rule_data.reference_field,
        is_active=rule_data.is_active,
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return BRERuleResponse(
        id=new_rule.id,
        rule_name=new_rule.rule_name,
        field=new_rule.field,
        operator=new_rule.operator,
        value=new_rule.value,
        value_type=new_rule.value_type,
        reference_field=new_rule.reference_field,
        is_active=new_rule.is_active,
        created_at=new_rule.created_at.isoformat() if new_rule.created_at else "",
        updated_at=new_rule.updated_at.isoformat() if new_rule.updated_at else "",
    )


@router.put("/rules/{rule_id}", response_model=BRERuleResponse)
def update_rule(
    rule_id: int,
    rule_data: BRERuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing rule."""
    rule = db.query(BRERule).filter(BRERule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BRE rule not found",
        )

    update_data = rule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)

    return BRERuleResponse(
        id=rule.id,
        rule_name=rule.rule_name,
        field=rule.field,
        operator=rule.operator,
        value=rule.value,
        value_type=rule.value_type,
        reference_field=rule.reference_field,
        is_active=rule.is_active,
        created_at=rule.created_at.isoformat() if rule.created_at else "",
        updated_at=rule.updated_at.isoformat() if rule.updated_at else "",
    )


@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a BRE rule."""
    rule = db.query(BRERule).filter(BRERule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BRE rule not found",
        )

    db.delete(rule)
    db.commit()

    return {"status": "success", "message": f"Rule '{rule.rule_name}' deleted"}
