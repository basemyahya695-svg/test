from flask import Blueprint, jsonify

from bill_service import BillService, serialize_bill
from config import DEFAULT_BILL_CURRENCY, EXCHANGE_RATES
from currency_utils import convert_currency
from response_utils import error_response, get_request_data, success_response
from session_utils import get_current_user_id, login_required


def create_bills_blueprint(bill_service=None):
    bills_bp = Blueprint("bills", __name__)
    bill_service = bill_service or BillService()

    @bills_bp.route("/api/bills", methods=["GET"])
    @login_required
    def get_bills():
        bills = bill_service.list_for_user(get_current_user_id())
        return jsonify([serialize_bill(bill) for bill in bills]), 200

    @bills_bp.route("/api/bills", methods=["POST"])
    @login_required
    def add_bill():
        try:
            bill_service.create(get_current_user_id(), get_request_data())
            return success_response("Bill added successfully", 201)
        except ValueError as error:
            return error_response(str(error), 400)

    @bills_bp.route("/api/bills/<int:bill_id>", methods=["PUT"])
    @login_required
    def update_bill(bill_id):
        try:
            bill = bill_service.update(get_current_user_id(), bill_id, get_request_data())
        except ValueError as error:
            return error_response(str(error), 400)
        if not bill:
            return error_response("Bill not found", 404)
        return success_response("Bill updated successfully")

    @bills_bp.route("/api/bills/<int:bill_id>", methods=["DELETE"])
    @login_required
    def delete_bill(bill_id):
        if not bill_service.delete(get_current_user_id(), bill_id):
            return error_response("Bill not found", 404)
        return success_response("Bill deleted successfully")

    @bills_bp.route("/api/bills/<int:bill_id>/pay", methods=["PATCH"])
    @login_required
    def mark_bill_as_paid(bill_id):
        if not bill_service.mark_paid(get_current_user_id(), bill_id):
            return error_response("Bill not found", 404)
        return success_response("Bill marked as paid")

    @bills_bp.route("/api/bills/<int:bill_id>/convert/<string:currency>", methods=["GET"])
    @login_required
    def get_converted_bill(bill_id, currency):
        bill = bill_service.find_for_user(get_current_user_id(), bill_id)
        if not bill:
            return error_response("Bill not found", 404)

        converted_amount = convert_currency(bill.amount, currency, bill.currency)

        if converted_amount is None:
            valid_list = ", ".join(EXCHANGE_RATES.keys())
            return error_response(f"Unsupported currency. Use one of: {valid_list}", 400)

        return jsonify({
            "id": bill.id,
            "name": bill.name,
            "original_amount": bill.amount,
            "original_currency": bill.currency,
            "original_amount_usd": convert_currency(bill.amount, DEFAULT_BILL_CURRENCY, bill.currency),
            "converted_amount": converted_amount,
            "currency": currency.upper(),
        }), 200

    return bills_bp
