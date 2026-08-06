from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "Loan Eligibility & Lead Management"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./loan_management.db"

    # JWT config
    SECRET_KEY: str = "loan-management-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_URL: str = "http://localhost:3000"

    # mock credit score API settings
    CREDIT_SCORE_API_URL: str = "mock://internal"
    CREDIT_SCORE_API_FAILURE_RATE: float = 0.05  # 5% failure


settings = Settings()
