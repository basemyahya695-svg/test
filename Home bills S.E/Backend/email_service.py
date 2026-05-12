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
            self.send_with_fallbacks(
                message,
                server,
                port,
                config.get("MAIL_USE_SSL", port == 465),
                config.get("MAIL_USE_TLS", True),
                username,
                password,
            )
        except smtplib.SMTPAuthenticationError:
            current_app.logger.exception("Email authentication failed")
            return {
                "sent": False,
                "error": "Gmail rejected the login. In Render, set MAIL_USERNAME to your Gmail address and MAIL_PASSWORD to a 16-character Gmail App Password, not your normal Gmail password.",
            }
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError, OSError) as error:
            current_app.logger.exception("Email connection failed")
            return {
                "sent": False,
                "error": f"Could not connect to the mail server ({type(error).__name__}: {error}). Try MAIL_SERVER=smtp.gmail.com, MAIL_PORT=465, MAIL_USE_SSL=true, MAIL_USE_TLS=false, then redeploy.",
            }
        except Exception as error:
            current_app.logger.exception("Email send failed")
            return {"sent": False, "error": str(error)}

        return {"sent": True, "error": ""}

    @staticmethod
    def normalized_password(password):
        return "".join(str(password or "").split())

    def send_with_fallbacks(self, message, server, port, use_ssl, use_tls, username, password):
        attempts = [(port, use_ssl, use_tls)]
        if server == "smtp.gmail.com" and (port, use_ssl, use_tls) != (465, True, False):
            attempts.append((465, True, False))

        last_error = None
        for attempt_port, attempt_ssl, attempt_tls in attempts:
            try:
                self.send_attempt(message, server, attempt_port, attempt_ssl, attempt_tls, username, password)
                return
            except smtplib.SMTPAuthenticationError:
                raise
            except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError, OSError) as error:
                last_error = error
                current_app.logger.warning("Email send attempt failed on port %s", attempt_port, exc_info=True)

        if last_error:
            raise last_error

    def send_attempt(self, message, server, port, use_ssl, use_tls, username, password):
        if use_ssl:
            with smtplib.SMTP_SSL(server, port, timeout=20) as smtp:
                self.login_and_send(smtp, message, username, password)
            return

        with smtplib.SMTP(server, port, timeout=20) as smtp:
            smtp.ehlo()
            if use_tls:
                smtp.starttls()
                smtp.ehlo()
            self.login_and_send(smtp, message, username, password)

    @staticmethod
    def login_and_send(smtp, message, username, password):
        smtp.login(username, password)
        smtp.send_message(message)
