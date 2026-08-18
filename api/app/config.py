from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 72
    frontend_url: str = "http://localhost:3000"
    port: int = 4000

    # Google Vertex AI
    google_cloud_project: Optional[str] = None
    google_cloud_location: str = "global"
    google_sa_json_path: Optional[str] = "data/sa.json"
    google_sa_json_paths: list[str] = []  # GOOGLE_SA_JSON_PATHS=data/sa1.json,data/sa2.json
    google_gemini_model: str = "gemini-3.1-flash-image-preview"
    api_base_url: str = "http://localhost:4000"

    # SA key pool sync
    gemini_pool_enabled: bool = False
    gemini_pool_list_url: str = ""
    gemini_pool_download_url: str = ""   # must contain {file}
    gemini_pool_token: str = ""
    gemini_pool_poll_seconds: int = 600  # 10 min default (keys rotate every 15 min)

    # Admin
    admin_secret: str = ""

    # Yandex OAuth
    yandex_client_id: Optional[str] = None
    yandex_client_secret: Optional[str] = None

    # VK OAuth
    vk_client_id: Optional[str] = None
    vk_client_secret: Optional[str] = None

    # Telegram Bot
    telegram_bot_token: Optional[str] = None
    telegram_bot_username: str = "card_era2_bot"
    telegram_webhook_secret: Optional[str] = None

    # Google OAuth
    google_oauth_client_id: Optional[str] = None
    google_oauth_client_secret: Optional[str] = None

    # Kling video
    kling_api_key: Optional[str] = None
    kling_webhook_secret: Optional[str] = None

    # YooKassa payments
    yookassa_shop_id: Optional[str] = None
    yookassa_secret_key: Optional[str] = None
    yookassa_webhook_secret: Optional[str] = None

    # Yandex Metrika (CDP order upload for payment attribution)
    yandex_metrika_token: Optional[str] = None
    yandex_metrika_counter_id: int = 109477886
    yandex_metrika_timeout_seconds: float = 10.0

    # S3-compatible object storage
    s3_endpoint: Optional[str] = None
    s3_bucket: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_region: str = "us-east-1"
    s3_public_url: Optional[str] = None  # public base URL for browser access

    # SMTP (password reset emails)
    smtp_host: Optional[str] = None
    smtp_port: int = 465
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
