from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_summary_model: str = "gemini-2.5-flash"
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_quick_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "models/gemini-embedding-001"
    gemini_tts_model: str = "gemini-2.5-flash-preview-tts"
    openrouter_api_key: str = ""
    openrouter_embedding_model: str = "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    openrouter_chat_model: str = "openrouter/free"
    openrouter_app_name: str = "Gemany Reading App"
    chroma_persist_dir: str = "./data/chroma"
    upload_dir: str = "./data/uploads"
    audiobooks_dir: str = "./data/audiobooks"
    assets_books_dir: str = "../assets/books"
    assets_musics_dir: str = "../assets/musics"
    assets_icons_dir: str = "../assets/icons"
    database_url: str = "sqlite+aiosqlite:///./data/db.sqlite"
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def has_gemini_api_key(self) -> bool:
        normalized_key = self.gemini_api_key.strip().lower()
        return bool(normalized_key) and normalized_key not in {
            "your_gemini_api_key_here",
            "your_api_key_here",
            "replace_me",
            "changeme",
        }

    @property
    def has_openrouter_api_key(self) -> bool:
        normalized_key = self.openrouter_api_key.strip().lower()
        return bool(normalized_key) and normalized_key not in {
            "your_openrouter_api_key_here",
            "your_api_key_here",
            "replace_me",
            "changeme",
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
