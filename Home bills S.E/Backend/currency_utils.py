from config import DEFAULT_BILL_CURRENCY, EXCHANGE_RATES


def convert_currency(amount, target_currency, source_currency=DEFAULT_BILL_CURRENCY):
    source = str(source_currency).upper()
    target = str(target_currency).upper()
    if source not in EXCHANGE_RATES or target not in EXCHANGE_RATES:
        return None
    amount_in_usd = float(amount) / EXCHANGE_RATES[source]
    return round(amount_in_usd * EXCHANGE_RATES[target], 2)
