from datetime import datetime

from config import DATE_FORMAT


def parse_date(value):
    if not value:
        raise ValueError("Due date is required")
    return datetime.strptime(str(value), DATE_FORMAT).date()


def format_date(value):
    return value.strftime(DATE_FORMAT) if value else None
