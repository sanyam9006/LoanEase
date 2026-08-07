"""Auth routes — login, admin creation, admin listing."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    CreateAdminRequest,
    UserResponse,
    UserListResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Admin login — returns JWT token."""
    user = db.query(User).filter(User.username == request.username).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(data={"sub": user.username})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=user.username,
        message="Login successful",
    )


@router.get("/admins", response_model=UserListResponse)
def list_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all admin users. Requires auth."""
    users = db.query(User).order_by(User.id).all()
    user_list = [
        UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            is_admin=u.is_admin,
            created_at=u.created_at.isoformat() if u.created_at else "",
        )
        for u in users
    ]
    return UserListResponse(users=user_list, total=len(user_list))


@router.post("/create-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    request: CreateAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new admin user. Only existing admins can do this."""
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{request.username}' is already taken",
        )

    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{request.email}' is already in use",
        )

    new_admin = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name or request.username.capitalize(),
        is_active=True,
        is_admin=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return UserResponse(
        id=new_admin.id,
        username=new_admin.username,
        email=new_admin.email,
        full_name=new_admin.full_name,
        is_active=new_admin.is_active,
        is_admin=new_admin.is_admin,
        created_at=new_admin.created_at.isoformat() if new_admin.created_at else "",
    )
