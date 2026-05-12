import smtplib
from email.message import EmailMessage

from flask import current_app


class EmailService:
    def send(self, recipient, subject, body):
        config = current_app.config
        server = config.get("MAIL_SERVER")
        port = config.get("MAIL_PORT", 465)
        sender = config.get("MAIL_FROM") or config.get("MAIL_USERNAME")
        username = config.get("MAIL_USERNAME")
        password = self.normalized_password(config.get("MAIL_PASSWORD"))

        if not server or not sender:
            current_app.logger.warning("Email not sent. Configure MAIL_SERVER and MAIL_FROM or MAIL_USERNAME.")
            return {
                "sent": False,
                "error": "Email is not configured. Set MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM.",
            }

        if not username:
            current_app.logger.warning("Email not sent. MAIL_USERNAME is missing.")
            return {
                "sent": False,
                "error": "Email username is missing. Set MAIL_USERNAME in Render.",
            }

        if not password:
            current_app.logger.warning("Email not sent. MAIL_PASSWORD is missing.")
            return {
                "sent": False,
                "error": "Email password is missing. Set MAIL_PASSWORD to your 16-character Gmail app password in Render.",
            }

        message = EmailMessage()
        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        try:
            if config.get("MAIL_USE_SSL", port == 465):
                with smtplib.SMTP_SSL(server, port, timeout=20) as smtp:
                    self.login_and_send(smtp, message, username, password)
            else:
                with smtplib.SMTP(server, port, timeout=20) as smtp:
                    smtp.ehlo()
                    if config.get("MAIL_USE_TLS", True):
                        smtp.starttls()
                        smtp.ehlo()
                    self.login_and_send(smtp, message, username, password)
        except smtplib.SMTPAuthenticationError:
            current_app.logger.exception("Email authentication failed")
            return {
                "sent": False,
                "error": "Gmail rejected the login. In Render, set MAIL_USERNAME to your Gmail address and MAIL_PASSWORD to a 16-character Gmail App Password, not your normal Gmail password.",
            }
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError, OSError):
            current_app.logger.exception("Email connection failed")
            return {
                "sent": False,
                "error": "Could not connect to the mail server. Check MAIL_SERVER=smtp.gmail.com, MAIL_PORT=587, MAIL_USE_TLS=true, and redeploy.",
            }
        except Exception as error:
            current_app.logger.exception("Email send failed")
            return {"sent": False, "error": str(error)}

        return {"sent": True, "error": ""}

    @staticmethod
    def normalized_password(password):
        return "".join(str(password or "").split())

    @staticmethod
    def login_and_send(smtp, message, username, password):
        smtp.login(username, password)
        smtp.send_message(message)
