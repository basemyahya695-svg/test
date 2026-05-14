from config import (
    BILL_STATUS_PAID,
    BILL_STATUS_UNPAID,
    DEFAULT_BILL_CATEGORY,
    DEFAULT_BILL_CURRENCY,
    DEFAULT_BILL_FREQUENCY,
    VALID_BILL_CATEGORIES,
    VALID_CURRENCIES,
)
from database import db
from models import Bill
from utils import format_date, parse_date, validate_frequency, validate_required_fields


class BillRepository:
    def list_for_user(self, user_id):
        return Bill.query.filter_by(user_id=user_id).order_by(Bill.due_date.asc()).all()

    def find_for_user(self, user_id, bill_id):
        return Bill.query.filter_by(id=bill_id, user_id=user_id).first()

    def add(self, bill):
        db.session.add(bill)
        db.session.commit()
        return bill

    def save(self):
        db.session.commit()

    def delete(self, bill):
        db.session.delete(bill)
        db.session.commit()


class BillPayloadValidator:
    REQUIRED_CREATE_FIELDS = ("name", "amount", "due_date", "frequency")

    def __init__(self, valid_categories=None, valid_currencies=None):
        self.valid_categories = valid_categories or VALID_BILL_CATEGORIES
        self.valid_currencies = valid_currencies or VALID_CURRENCIES

    def build_create_payload(self, data):
        required_error = validate_required_fields(data, self.REQUIRED_CREATE_FIELDS)
        if required_error:
            raise ValueError(required_error)

        return {
            "name": data["name"],
            "category": self.validate_category(data.get("category", DEFAULT_BILL_CATEGORY)),
            "amount": self.parse_amount(data["amount"]),
            "currency": self.validate_currency(data.get("currency", DEFAULT_BILL_CURRENCY)),
            "due_date": parse_date(data["due_date"]),
            "frequency": self.validate_frequency(data.get("frequency", DEFAULT_BILL_FREQUENCY)),
            "status": BILL_STATUS_UNPAID,
        }

    def apply_updates(self, bill, data):
        if "name" in data:
            bill.name = data["name"]
        if "category" in data:
            bill.category = self.validate_category(data["category"])
        if "amount" in data:
            bill.amount = self.parse_amount(data["amount"])
        if "currency" in data:
            bill.currency = self.validate_currency(data["currency"])
        if "due_date" in data:
            bill.due_date = parse_date(data["due_date"])
        if "frequency" in data:
            bill.frequency = self.validate_frequency(data["frequency"])

    @staticmethod
    def parse_amount(value):
        amount = float(value)
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
        return amount

    def validate_category(self, value):
        category = str(value).lower()
        if category not in self.valid_categories:
            valid_categories = ", ".join(sorted(self.valid_categories))
            raise ValueError(f"Invalid bill type. Use one of: {valid_categories}")
        return category

    def validate_currency(self, value):
        currency = str(value).upper()
        if currency not in self.valid_currencies:
            valid_currencies = ", ".join(sorted(self.valid_currencies))
            raise ValueError(f"Invalid currency. Use one of: {valid_currencies}")
        return currency

    @staticmethod
    def validate_frequency(value):
        error = validate_frequency(value)
        if error:
            raise ValueError(error)
        return value


class BillService:
    def __init__(self, repository=None, validator=None):
        self.repository = repository or BillRepository()
        self.validator = validator or BillPayloadValidator()

    def list_for_user(self, user_id):
        return self.repository.list_for_user(user_id)

    def find_for_user(self, user_id, bill_id):
        return self.repository.find_for_user(user_id, bill_id)

    def create(self, user_id, data):
        payload = self.validator.build_create_payload(data)
        return self.repository.add(Bill(user_id=user_id, **payload))

    def update(self, user_id, bill_id, data):
        bill = self.find_for_user(user_id, bill_id)
        if not bill:
            return None
        self.validator.apply_updates(bill, data)
        self.repository.save()
        return bill

    def delete(self, user_id, bill_id):
        bill = self.find_for_user(user_id, bill_id)
        if not bill:
            return False
        self.repository.delete(bill)
        return True

    def mark_paid(self, user_id, bill_id):
        bill = self.find_for_user(user_id, bill_id)
        if not bill:
            return False
        bill.status = BILL_STATUS_PAID
        self.repository.save()
        return True


def serialize_bill(bill):
    return {
        "id": bill.id,
        "name": bill.name,
        "category": bill.category,
        "amount": bill.amount,
        "currency": bill.currency,
        "due_date": format_date(bill.due_date),
        "frequency": bill.frequency,
        "status": bill.status,
    }
