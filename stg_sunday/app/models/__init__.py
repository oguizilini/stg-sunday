"""Facilita importações dos modelos."""

from models.base import Base  # noqa: F401
from models.entities import (  # noqa: F401
    Automation,
    Contract,
    ContractPhase,
    ContractStatus,
    Document,
    PhaseStatus,
    StorageType,
    Task,
    TaskPriority,
    TaskStatus,
    User,
    UserRole,
)

__all__ = [
    "Base",
    "Automation",
    "Contract",
    "ContractPhase",
    "ContractStatus",
    "Document",
    "PhaseStatus",
    "StorageType",
    "Task",
    "TaskPriority",
    "TaskStatus",
    "User",
    "UserRole",
]
