from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://edusaas:edusaas@localhost:5434/edusaas"
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = "change-me-in-production-edusaas-dev"
    jwt_access_minutes: int = 30
    jwt_refresh_days: int = 7
    public_base_url: str = "http://localhost:8000"
    app_version: str = "2.0.0"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
