from functools import wraps

from flask import session

from response_utils import error_response

SESSION_USER_ID_KEY = "user_id"
UNAUTHORIZED_MESSAGE = "Unauthorized access"


def get_current_user_id():
    return session.get(SESSION_USER_ID_KEY)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not get_current_user_id():
            return error_response(UNAUTHORIZED_MESSAGE, 401)
        return view(*args, **kwargs)

    return wrapped
