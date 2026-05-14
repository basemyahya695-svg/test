from flask import jsonify, request


def get_request_data():
    return request.get_json(silent=True) or {}


def error_response(message, status_code=400):
    return jsonify({"error": message, "message": message}), status_code


def success_response(message, status_code=200, **extra):
    payload = {"message": message}
    payload.update(extra)
    return jsonify(payload), status_code
