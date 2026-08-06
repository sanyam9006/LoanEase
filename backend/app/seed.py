"""
Database seeder — sets up default admin user and BRE rules on first run.
Can also run standalone: python -m app.seed
"""

from app.core.database import SessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User
from app.models.bre_rule import BRERule


def seed_admin_user(db):
    """Create default admin if it doesn't exist yet."""
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("[seed] Admin user already exists, skipping")
        return

    admin = User(
        username="admin",
        email="admin@loanmanagement.com",
        hashed_password=hash_password("admin123"),
        full_name="System Admin",
        is_active=True,
        is_admin=True,
    )
    db.add(admin)
    db.commit()
    print("[seed] Created admin user (admin / admin123)")


def seed_bre_rules(db):
    """Add default BRE rules if table is empty."""
    count = db.query(BRERule).count()
    if count > 0:
        print(f"[seed] BRE rules already exist ({count} rules), skipping")
        return

    default_rules = [
        BRERule(
            rule_name="Minimum Age",
            field="age",
            operator=">=",
            value=21,
            value_type="numeric",
        ),
        BRERule(
            rule_name="Maximum Age",
            field="age",
            operator="<=",
            value=60,
            value_type="numeric",
        ),
        BRERule(
            rule_name="Minimum Monthly Income",
            field="monthly_income",
            operator=">=",
            value=30000,
            value_type="numeric",
        ),
        BRERule(
            rule_name="Minimum Credit Score",
            field="credit_score",
            operator=">=",
            value=700,
            value_type="numeric",
        ),
        BRERule(
            rule_name="Loan to Property Value Ratio",
            field="loan_amount",
            operator="<=",
            value=80,
            value_type="percentage",
            reference_field="property_value",
        ),
    ]

    db.add_all(default_rules)
    db.commit()
    print(f"[seed] Added {len(default_rules)} default BRE rules")


def seed_database():
    """Init DB tables and seed default data."""
    print("\n--- Initializing database ---")
    init_db()
    print("Tables created")

    print("Seeding data...")
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_bre_rules(db)
        print("Database ready!\n")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
