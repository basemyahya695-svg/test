from flask import Blueprint, jsonify, request

from auth_service import UserRepository
from bill_service import BillService, serialize_bill
from config import POPUP_REMINDER_DAYS_AHEAD
from reminder_service import ReminderService
from response_utils import get_request_data
from session_utils import get_current_user_id, login_required


def create_schedule_blueprint(bill_service=None, reminder_service=None, users=None):
    schedule_bp = Blueprint("schedule", __name__)
    bill_service = bill_service or BillService()
    reminder_service = reminder_service or ReminderService()
    users = users or UserRepository()

    @schedule_bp.route("/api/schedule", methods=["GET"])
    @login_required
    def get_schedule():
        schedule = {
            "weekly": [],
            "monthly": [],
            "yearly": [],
        }

        for bill in bill_service.list_for_user(get_current_user_id()):
            if bill.frequency in schedule:
                schedule[bill.frequency].append(serialize_bill(bill))

        return jsonify(schedule), 200

    @schedule_bp.route("/api/reminders", methods=["GET"])
    @login_required
    def get_reminders():
        try:
            days = int(request.args.get("days", POPUP_REMINDER_DAYS_AHEAD))
        except (TypeError, ValueError):
            days = POPUP_REMINDER_DAYS_AHEAD

        days = max(1, min(days, 30))
        return jsonify(reminder_service.build_reminders(get_current_user_id(), days)), 200

    @schedule_bp.route("/api/reminders/send", methods=["POST"])
    @login_required
    def send_reminder_email():
        user = users.find_by_id(get_current_user_id())
        if not user:
            return jsonify({"sent": False, "count": 0, "message": "User not found"}), 404

        request_data = get_request_data()
        result = reminder_service.send_current_month_unpaid_email(
            user,
            paid_occurrences=request_data.get("paid_occurrences", {}),
            unpaid_occurrences=request_data.get("unpaid_occurrences"),
        )
        return jsonify(result), 200

    return schedule_bp
