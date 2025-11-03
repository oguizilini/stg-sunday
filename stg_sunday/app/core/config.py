"""Configurações da aplicação carregadas via variáveis de ambiente."""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Valores configuráveis da aplicação."""

    database_url: str = Field(
        default="mysql+asyncmy://user:password@localhost:3306/stg_contracts?charset=latin1",
        alias="DATABASE_URL",
        description="DSN de conexão com MySQL 5.7 utilizando charset latin1.",
    )

    secret_key: str = Field(
        default="change-me", alias="SECRET_KEY", description="Chave para assinar tokens/cookies."
    )

    # Configuração para pydantic-settings (Pydantic v2)
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância única de Settings (cacheada)."""

    return Settings()


settings = get_settings()
