"""Configuração da engine e sessão async do SQLAlchemy."""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import settings
from models.base import Base


engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield de sessão para ser usado como dependência nas rotas."""

    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Garante que as tabelas existam (usar apenas em cenários controlados)."""

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
