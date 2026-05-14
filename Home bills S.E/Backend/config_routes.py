from flask import Blueprint, jsonify

from config import currency_options


def create_config_blueprint():
    config_bp = Blueprint("config", __name__)

    @config_bp.route("/api/config/currencies", methods=["GET"])
    def get_currencies():
        return jsonify({"currencies": currency_options()}), 200

    return config_bp
