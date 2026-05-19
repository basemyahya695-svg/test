from datetime import date, timedelta

from config import (
    BILL_STATUS_UNPAID,
    EMAIL_REMINDER_DAYS_AHEAD,
    POPUP_REMINDER_DAYS_AHEAD,
    RENT_BILL_CATEGORY,
)
from email_service import EmailService
from models import Bill
from recurrence_service import RecurrenceService
from reminder_email_builder import ReminderEmailBuilder
from date_utils import format_date


class ReminderBillRepository:
    def unpaid_due_before(self, user_id, deadline, category=None):
        filters = [
            Bill.user_id == user_id,
            Bill.status == BILL_STATUS_UNPAID,
            Bill.due_date <= deadline,
        ]
        if category:
            filters.append(Bill.category == category)

        return Bill.query.filter(*filters).order_by(Bill.due_date.asc()).all()


class ReminderSerializer:
    @staticmethod
    def occurrence_key(bill_id, due_date):
        return f"{bill_id}:{format_date(due_date)}"

    @staticmethod
    def serialize_bill(bill, due_date=None):
        today = date.today()
        due_date = due_date or bill.due_date
        if due_date < today:
            state = "overdue"
        elif due_date == today:
            state = "due today"
        else:
            state = "due soon"

        return {
            "id": bill.id,
            "name": bill.name,
            "category": bill.category,
            "amount": bill.amount,
            "currency": bill.currency,
            "due_date": format_date(due_date),
            "status": bill.status,
            "state": state,
        }


class ReminderMailer:
    def __init__(self, email_service=None, email_builder=None):
        self.email_service = email_service or EmailService()
        self.email_builder = email_builder or ReminderEmailBuilder()

    def send_monthly_unpaid(self, user, reminders):
        result = self.email_service.send(
            recipient=user.email,
            subject="MyHome Monthly Unpaid Bills",
            body=self.email_builder.monthly_unpaid_body(reminders),
        )
        return self.email_result(result, reminders, "Sent {count} unpaid bill(s) via email")

    def send_rent_due(self, user, reminders):
        result = self.email_service.send(
            recipient=user.email,
            subject="MyHome rent reminder: rent due within two weeks",
            body=self.email_builder.rent_due_body(reminders),
        )
        return self.email_result(result, reminders, "Rent reminder email sent with bill type and payment status")

    @staticmethod
    def email_result(result, reminders, success_message):
        return {
            "sent": result["sent"],
            "count": len(reminders),
            "message": success_message.format(count=len(reminders)) if result["sent"] else result.get("error", "Failed to send email"),
            "bills": reminders,
        }


class ReminderService:
    def __init__(
        self,
        email_service=None,
        recurrence_service=None,
        email_builder=None,
        bills=None,
        serializer=None,
        mailer=None,
    ):
        self.recurrence = recurrence_service or RecurrenceService()
        self.bills = bills or ReminderBillRepository()
        self.serializer = serializer or ReminderSerializer()
        self.mailer = mailer or ReminderMailer(email_service, email_builder)

    def due_or_near_due_bills(self, user_id, days_ahead):
        return self.due_or_near_due_bills_by_category(user_id, days_ahead)

    def due_or_near_due_bills_by_category(self, user_id, days_ahead, category=None):
        deadline = date.today() + timedelta(days=days_ahead)
        return self.bills.unpaid_due_before(user_id, deadline, category)

    def due_or_near_due_rent_occurrences(self, user_id, days_ahead):
        today = date.today()
        deadline = today + timedelta(days=days_ahead)
        rent_bills = self.due_or_near_due_bills_by_category(
            user_id=user_id,
            days_ahead=days_ahead,
            category=RENT_BILL_CATEGORY,
        )

        occurrences = []
        for bill in rent_bills:
            for due_date in self.recurrence.expand_due_dates(bill, today, deadline):
                if due_date <= today or due_date == deadline:
                    occurrences.append({"bill": bill, "due_date": due_date})

        return sorted(occurrences, key=lambda occurrence: occurrence["due_date"])

    def build_reminders(self, user_id, days_ahead=POPUP_REMINDER_DAYS_AHEAD):
        today = date.today()
        deadline = today + timedelta(days=days_ahead)
        reminders = []

        for bill in self.due_or_near_due_bills(user_id, days_ahead):
            for due_date in self.recurrence.expand_due_dates(bill, today, deadline):
                reminders.append(self.serializer.serialize_bill(bill, due_date))

        return sorted(reminders, key=lambda reminder: reminder["due_date"])

    def current_month_unpaid_bills(self, user_id, paid_occurrences=None, unpaid_occurrences=None):
        paid_occurrences = paid_occurrences or {}
        has_unpaid_occurrence_filter = unpaid_occurrences is not None
        unpaid_occurrence_keys = set(unpaid_occurrences or [])
        today = date.today()
        month_start = date(today.year, today.month, 1)
        month_end = date(today.year, today.month, self.recurrence.days_in_month(today.year, today.month))
        bills = self.bills.unpaid_due_before(user_id, month_end)

        reminders = []
        for bill in bills:
            for due_date in self.recurrence.expand_due_dates(bill, month_start, month_end):
                occurrence_key = self.serializer.occurrence_key(bill.id, due_date)
                if has_unpaid_occurrence_filter and occurrence_key not in unpaid_occurrence_keys:
                    continue
                if self.is_occurrence_paid(occurrence_key, paid_occurrences):
                    continue
                reminders.append(self.serializer.serialize_bill(bill, due_date))

        return sorted(reminders, key=lambda reminder: reminder["due_date"])

    def send_current_month_unpaid_email(self, user, paid_occurrences=None, unpaid_occurrences=None):
        reminders = self.current_month_unpaid_bills(user.id, paid_occurrences, unpaid_occurrences)
        if not reminders:
            return {
                "sent": False,
                "count": 0,
                "message": "No unpaid bills for this month",
                "bills": [],
            }

        return self.mailer.send_monthly_unpaid(user, reminders)

    @staticmethod
    def is_occurrence_paid(occurrence_key, paid_occurrences):
        return bool(paid_occurrences.get(occurrence_key))

    def send_due_emails(self, user):
        reminders = [
            self.serializer.serialize_bill(occurrence["bill"], occurrence["due_date"])
            for occurrence in self.due_or_near_due_rent_occurrences(user.id, EMAIL_REMINDER_DAYS_AHEAD)
        ]
        if not reminders:
            return {"sent": False, "count": 0, "message": "No rent bills due in the next two weeks"}

        return self.mailer.send_rent_due(user, reminders)
