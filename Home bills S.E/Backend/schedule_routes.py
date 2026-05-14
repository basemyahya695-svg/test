from flask import Blueprint, jsonify

from auth_service import UserRepository
from bill_service import BillService, serialize_bill
from reminder_service import ReminderService
from utils import get_current_user_id, get_request_data, login_required

schedule_bp = Blueprint('schedule', __name__)
bill_service = BillService()
reminders = ReminderService()
users = UserRepository()

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
    return jsonify(reminders.build_reminders(get_current_user_id())), 200


@schedule_bp.route("/api/reminders/send", methods=["POST"])
@login_required
def send_reminder_email():
    user = users.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"sent": False, "count": 0, "message": "User not found"}), 404

    request_data = get_request_data()
    result = reminders.send_current_month_unpaid_email(
        user,
        paid_occurrences=request_data.get("paid_occurrences", {}),
        unpaid_occurrences=request_data.get("unpaid_occurrences"),
    )
    return jsonify(result), 200
