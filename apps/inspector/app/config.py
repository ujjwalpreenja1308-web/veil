from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    inspector_api_key: str
    inspector_model: str = "openai/gpt-4o"
    inspector_opus_model: str = "openai/gpt-4o"


settings = Settings()
