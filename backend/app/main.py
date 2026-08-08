"""
Main FastAPI app entry point.
Run: uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import auth, leads, bre, dashboard
from app.seed import seed_database


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Loan Eligibility & Lead Management API with BRE, Credit Score integration, and Admin Panel.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register all route groups
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(bre.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    """Create tables + seed default data if first run."""
    seed_database()


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api", tags=["Health"])
def api_info():
    return {
        "status": "running",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth/login",
            "leads": "/api/leads",
            "bre_rules": "/api/bre/rules",
            "dashboard": "/api/dashboard/stats",
        },
    }
