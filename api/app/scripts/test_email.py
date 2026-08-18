"""Standalone SMTP test — sends one test email and prints any error in full.

Run inside the API container, where SMTP_* env vars are already set:

    python -m app.scripts.test_email you@example.com
"""
import logging
import sys

from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("test_email")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m app.scripts.test_email <to_email>")
        sys.exit(1)
    to = sys.argv[1]

    print(f"SMTP_HOST={settings.smtp_host!r}")
    print(f"SMTP_PORT={settings.smtp_port!r}")
    print(f"SMTP_USER={settings.smtp_user!r}")
    print(f"SMTP_FROM={settings.smtp_from!r}")
    print(f"SMTP_PASSWORD set: {bool(settings.smtp_password)}")

    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        print("\nSMTP не настроен (один из SMTP_HOST/SMTP_USER/SMTP_PASSWORD пуст) — выходим.")
        sys.exit(1)

    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "ERA2 Card — тест SMTP"
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to
    msg.attach(MIMEText("<p>Это тестовое письмо из test_email.py</p>", "html", "utf-8"))

    print(f"\nПодключаюсь к {settings.smtp_host}:{settings.smtp_port}...")
    try:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            print("Соединение установлено, логинимся...")
            server.login(settings.smtp_user, settings.smtp_password)
            print("Логин успешен, отправляем письмо...")
            server.sendmail(msg["From"], [to], msg.as_string())
        print(f"\nГотово — письмо отправлено на {to}")
    except Exception as e:
        print(f"\nОШИБКА: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
