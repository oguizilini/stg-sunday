"""Declaração base para os modelos ORM."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe base compartilhada pelos modelos."""

    pass
