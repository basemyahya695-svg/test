import os

from flask import Flask, redirect, url_for
from flask_cors import CORS

from auth_routes import create_auth_blueprint
from auth_service import AuthService, UserRepository
from bill_routes import create_bills_blueprint
from bill_service import BillService
from config_routes import create_config_blueprint
from config import API_DEFAULT_PORT, Config
from database import db
from reminder_service import ReminderService
from schedule_routes import create_schedule_blueprint
from schema import ensure_schema

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Frontend"))
if not os.path.isdir(FRONTEND_DIR):
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "Frontend"))


def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config.from_object(Config)

    register_extensions(app)
    register_routes(app)
    initialize_database(app)

    return app


def register_extensions(app):
    db.init_app(app)
    CORS(
        app,
        supports_credentials=True,
        origins=Config.CORS_ORIGINS,
    )


def register_routes(app):
    auth_service = AuthService()
    bill_service = BillService()
    reminder_service = ReminderService()
    user_repository = UserRepository()

    app.register_blueprint(create_auth_blueprint(auth_service, reminder_service))
    app.register_blueprint(create_bills_blueprint(bill_service))
    app.register_blueprint(create_config_blueprint())
    app.register_blueprint(create_schedule_blueprint(bill_service, reminder_service, user_repository))

    @app.route("/")
    def index():
        return redirect(url_for("static", filename="Html/Login.html"))


def initialize_database(app):
    with app.app_context():
        db.create_all()
        ensure_schema()


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", API_DEFAULT_PORT))
    app.run(host="0.0.0.0", port=port)
