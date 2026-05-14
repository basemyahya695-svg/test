from datetime import date, timedelta

from app import create_app
from auth_service import PasswordHasher
from config import BILL_STATUS_UNPAID
from database import db
from models import Bill, User
from schema import ensure_schema

DEMO_EMAIL = "demo@myhome.local"
DEMO_PASSWORD = "DemoPass123"
DEMO_USERNAME = "Demo User"


def sample_bills(user_id):
    today = date.today()
    return [
        Bill(
            user_id=user_id,
            name="Apartment Rent",
            category="rent",
            amount=850,
            currency="USD",
            due_date=today + timedelta(days=3),
            frequency="monthly",
            status=BILL_STATUS_UNPAID,
        ),
        Bill(
            user_id=user_id,
            name="Electricity Bill",
            category="electricity",
            amount=220,
            currency="ILS",
            due_date=today + timedelta(days=8),
            frequency="monthly",
            status=BILL_STATUS_UNPAID,
        ),
        Bill(
            user_id=user_id,
            name="Water Service",
            category="water",
            amount=45,
            currency="JOD",
            due_date=today - timedelta(days=2),
            frequency="monthly",
            status=BILL_STATUS_UNPAID,
        ),
        Bill(
            user_id=user_id,
            name="Home Internet",
            category="wifi",
            amount=32,
            currency="USD",
            due_date=today + timedelta(days=14),
            frequency="monthly",
            status=BILL_STATUS_UNPAID,
        ),
    ]


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()
        ensure_schema()

        user = User.query.filter_by(email=DEMO_EMAIL).first()
        if not user:
            user = User(
                username=DEMO_USERNAME,
                email=DEMO_EMAIL,
                password_hash=PasswordHasher().hash(DEMO_PASSWORD),
            )
            db.session.add(user)
            db.session.commit()

        if not user.bills:
            db.session.add_all(sample_bills(user.id))
            db.session.commit()

        print(f"Seeded demo account: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"Demo bills in database: {len(user.bills)}")


if __name__ == "__main__":
    seed()
