from config import VALID_FREQUENCIES


def validate_required_fields(data, fields):
    missing = [field for field in fields if data.get(field) in (None, "")]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None


def validate_frequency(frequency):
    if frequency not in VALID_FREQUENCIES:
        return f"Invalid frequency. Use one of: {', '.join(sorted(VALID_FREQUENCIES))}"
    return None
