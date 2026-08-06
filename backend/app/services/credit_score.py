"""
Mock Credit Score service.

Real CIBIL APIs need NBFC/bank license so we're using a mock here.
Generates deterministic scores from name+mobile hash, simulates
latency and occasional failures for realistic testing.

To plug in a real API later, just swap out fetch_credit_score().
"""

import hashlib
import random
import time
from typing import Optional
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class CreditScoreResult:
    success: bool
    score: Optional[int] = None
    error: Optional[str] = None
    provider: str = "MockCreditBureau"


def _generate_mock_score(name: str, mobile: str) -> int:
    """
    Hash-based score generation. Same name+mobile always gives same score.
    Range: 300-900 (same as real CIBIL).
    """
    data_str = f"{name.lower().strip()}{mobile.strip()}"
    hash_val = int(hashlib.md5(data_str.encode()).hexdigest(), 16)

    base_score = 300 + (hash_val % 601)

    # add small jitter so it feels more realistic
    seed = int(hashlib.sha256(data_str.encode()).hexdigest(), 16) % 100
    jitter = (seed % 41) - 20  # -20 to +20

    score = max(300, min(900, base_score + jitter))
    return score


def fetch_credit_score(name: str, mobile: str) -> CreditScoreResult:
    """Fetch credit score for a customer (mock implementation)."""

    # simulate network delay
    time.sleep(random.uniform(0.05, 0.2))

    # simulate random API failures
    if random.random() < settings.CREDIT_SCORE_API_FAILURE_RATE:
        return CreditScoreResult(
            success=False,
            error="Credit Bureau API temporarily unavailable. Please try again.",
            provider="MockCreditBureau",
        )

    try:
        score = _generate_mock_score(name, mobile)
        return CreditScoreResult(
            success=True,
            score=score,
            provider="MockCreditBureau",
        )
    except Exception as e:
        return CreditScoreResult(
            success=False,
            error=f"Error fetching credit score: {str(e)}",
            provider="MockCreditBureau",
        )
