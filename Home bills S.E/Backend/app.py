import os

from flask import Flask
from flask_cors import CORS

from auth_routes import auth_bp
from bill_routes import bills_bp
from config import Config
from database import db
from schedule_routes import schedule_bp
from schema import ensure_schema

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    CORS(
        app,
        supports_credentials=True,
        origins=Config.CORS_ORIGINS,
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(bills_bp)
    app.register_blueprint(schedule_bp)

    with app.app_context():
        db.create_all()
        ensure_schema()

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
