from datetime import date, timedelta

from config import DEFAULT_BILL_FREQUENCY


WEEKLY_INTERVAL_DAYS = 7
DECEMBER = 12
JANUARY = 1


class RecurrenceService:
    def __init__(self, frequency_strategies=None):
        self.frequency_strategies = frequency_strategies or {
            "weekly": self.add_week,
            "monthly": self.add_month,
            "yearly": self.add_year,
        }

    def expand_due_dates(self, bill, start_date, end_date):
        due_date = bill.due_date
        frequency = bill.frequency or DEFAULT_BILL_FREQUENCY

        if frequency == DEFAULT_BILL_FREQUENCY:
            return [due_date] if due_date <= end_date else []

        next_date = self.frequency_strategies.get(frequency)

        if not next_date:
            return [due_date] if due_date <= end_date else []

        current = due_date
        while current < start_date:
            current = next_date(current)

        dates = []
        while current <= end_date:
            dates.append(current)
            current = next_date(current)
        return dates

    @staticmethod
    def add_week(value):
        return value + timedelta(days=WEEKLY_INTERVAL_DAYS)

    @staticmethod
    def add_month(value):
        year = value.year + (1 if value.month == DECEMBER else 0)
        month = JANUARY if value.month == DECEMBER else value.month + 1
        day = min(value.day, RecurrenceService.days_in_month(year, month))
        return date(year, month, day)

    @staticmethod
    def add_year(value):
        year = value.year + 1
        day = min(value.day, RecurrenceService.days_in_month(year, value.month))
        return date(year, value.month, day)

    @staticmethod
    def days_in_month(year, month):
        if month == DECEMBER:
            next_month = date(year + 1, JANUARY, 1)
        else:
            next_month = date(year, month + 1, 1)
        return (next_month - timedelta(days=1)).day
