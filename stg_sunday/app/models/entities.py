"""Modelos ORM que representam as tabelas principais."""

from __future__ import annotations

from datetime import datetime, date
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


STRING_191 = 191


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class ContractStatus(str, Enum):
    DRAFT = "rascunho"
    NEGOTIATION = "em_negociacao"
    SIGNED = "assinado"
    EXECUTION = "em_execucao"
    CLOSED = "encerrado"
    CANCELED = "cancelado"


class PhaseStatus(str, Enum):
    PENDING = "pendente"
    IN_PROGRESS = "em_andamento"
    DONE = "concluida"
    BLOCKED = "bloqueada"


class TaskStatus(str, Enum):
    NEW = "novo"
    IN_PROGRESS = "em_andamento"
    DONE = "concluido"
    CANCELED = "cancelado"
    LATE = "atrasado"


class TaskPriority(str, Enum):
    LOW = "baixa"
    MEDIUM = "media"
    HIGH = "alta"
    CRITICAL = "critica"


class StorageType(str, Enum):
    LOCAL = "local"
    S3 = "s3"
    AZURE = "azure"
    GCP = "gcp"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(STRING_191), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(STRING_191), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.USER)
    is_active: Mapped[int] = mapped_column(SmallInteger, default=1)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_contracts: Mapped[List["Contract"]] = relationship(
        "Contract",
        back_populates="assigned_user",
        foreign_keys="Contract.assigned_user_id",
    )
    client_contracts: Mapped[List["Contract"]] = relationship(
        "Contract",
        back_populates="client",
        foreign_keys="Contract.client_id",
    )


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ContractStatus] = mapped_column(SqlEnum(ContractStatus), default=ContractStatus.DRAFT)
    contract_type: Mapped[Optional[str]] = mapped_column(String(STRING_191), nullable=True)
    client_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    value: Mapped[Optional[float]] = mapped_column(Numeric(18, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_user: Mapped[Optional[User]] = relationship(
        "User",
        back_populates="assigned_contracts",
        foreign_keys=[assigned_user_id],
    )
    client: Mapped[Optional[User]] = relationship(
        "User",
        back_populates="client_contracts",
        foreign_keys=[client_id],
    )
    phases: Mapped[List["ContractPhase"]] = relationship(
        "ContractPhase",
        back_populates="contract",
        cascade="all, delete-orphan",
        order_by="ContractPhase.phase_order",
    )
    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="contract",
        cascade="all, delete-orphan",
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="contract",
        cascade="all, delete-orphan",
    )


class ContractPhase(Base):
    __tablename__ = "contract_phases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    phase_name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    phase_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    responsible_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[PhaseStatus] = mapped_column(SqlEnum(PhaseStatus), default=PhaseStatus.PENDING)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contract: Mapped[Contract] = relationship("Contract", back_populates="phases")
    responsible: Mapped[Optional[User]] = relationship("User")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="phase")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    file_path: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    storage_type: Mapped[StorageType] = mapped_column(SqlEnum(StorageType), default=StorageType.LOCAL)
    version: Mapped[int] = mapped_column(SmallInteger, default=1)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    upload_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    contract: Mapped[Contract] = relationship("Contract", back_populates="documents")
    uploader: Mapped[User] = relationship("User")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    phase_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contract_phases.id"), nullable=True)
    description: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(SqlEnum(TaskStatus), default=TaskStatus.NEW)
    priority: Mapped[TaskPriority] = mapped_column(SqlEnum(TaskPriority), default=TaskPriority.MEDIUM)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contract: Mapped[Contract] = relationship("Contract", back_populates="tasks")
    phase: Mapped[Optional[ContractPhase]] = relationship("ContractPhase", back_populates="tasks")
    assignee: Mapped[Optional[User]] = relationship("User")


class Automation(Base):
    __tablename__ = "automations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    action: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[int] = mapped_column(SmallInteger, default=1)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator: Mapped[User] = relationship("User")
