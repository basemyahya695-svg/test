import os
from datetime import timedelta


def load_local_env(filename=".env"):
    env_path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(env_path):
        return

    with open(env_path, encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()


DEFAULT_CORS_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://127.0.0.1:5502",
    "http://localhost:5502",
    "null",
]


def parse_csv_env(name, default):
    value = os.environ.get(name, "")
    entries = [entry.strip() for entry in value.split(",") if entry.strip()]
    return entries or default


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(24))
    SQLALCHEMY_DATABASE_URI = "sqlite:///myhome.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=10)
    CORS_ORIGINS = parse_csv_env("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_FROM = os.environ.get("MAIL_FROM", os.environ.get("MAIL_USERNAME", ""))
    MAIL_USE_SSL = os.environ.get("MAIL_USE_SSL", "false").lower() == "true"
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"


API_DEFAULT_PORT = 5000
SMTP_SSL_PORT = 465
# Two weeks is enough lead time for rent reminders without creating early noise.
EMAIL_REMINDER_DAYS_AHEAD = 14
# Popup reminders stay short-term so they feel urgent and actionable in the dashboard.
POPUP_REMINDER_DAYS_AHEAD = 3
DATE_FORMAT = "%Y-%m-%d"
BILL_STATUS_UNPAID = "unpaid"
BILL_STATUS_PAID = "paid"
DEFAULT_BILL_CURRENCY = "USD"
DEFAULT_BILL_CATEGORY = "other"
DEFAULT_BILL_FREQUENCY = "once"
RENT_BILL_CATEGORY = "rent"
VALID_FREQUENCIES = {"weekly", "monthly", "yearly", "once"}
VALID_CURRENCIES = {"USD", "ILS", "JOD", "SAR", "EUR", "EGP"}
VALID_BILL_CATEGORIES = {"rent", "water", "gas", "wifi", "electricity", "other"}

EXCHANGE_RATES = {
    "USD": 1.0,
    "ILS": 3.70, 
    "JOD": 0.71,
    "SAR": 3.75,
    "EUR": 0.92,
    "EGP": 47.50
}

CURRENCY_SYMBOLS = {
    "USD": "$",
    "ILS": "₪",
    "JOD": "JD",
    "SAR": "SR",
    "EUR": "€",
    "EGP": "E£",
}


def currency_options():
    return {
        currency: {
            "label": currency,
            "symbol": CURRENCY_SYMBOLS[currency],
            "rate": EXCHANGE_RATES[currency],
        }
        for currency in sorted(VALID_CURRENCIES)
    }
