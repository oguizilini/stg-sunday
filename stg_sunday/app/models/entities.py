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
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


STRING_191 = 191


def enum_values(enum_cls):
    """Retorna a lista de valores de um Enum (str) para persistir no MySQL.

    Evita gravar o .name (ex.: DRAFT) e usa o .value (ex.: 'rascunho'),
    compatível com os ENUMs do schema latin1.
    """

    return [e.value for e in enum_cls]


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


class BoardColumnType(str, Enum):
    TEXT = "text"
    STATUS = "status"
    DATE = "date"
    PEOPLE = "people"
    NUMBER = "number"
    LABEL = "label"
    CLIENT = "client"
    OBSERVATION = "observation"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(STRING_191), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(STRING_191), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, values_callable=enum_values), default=UserRole.USER
    )
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
    status: Mapped[ContractStatus] = mapped_column(
        SqlEnum(ContractStatus, values_callable=enum_values), default=ContractStatus.DRAFT
    )
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
    status: Mapped[PhaseStatus] = mapped_column(
        SqlEnum(PhaseStatus, values_callable=enum_values), default=PhaseStatus.PENDING
    )
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
    storage_type: Mapped[StorageType] = mapped_column(
        SqlEnum(StorageType, values_callable=enum_values), default=StorageType.LOCAL
    )
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
    status: Mapped[TaskStatus] = mapped_column(
        SqlEnum(TaskStatus, values_callable=enum_values), default=TaskStatus.NEW
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SqlEnum(TaskPriority, values_callable=enum_values), default=TaskPriority.MEDIUM
    )
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


class Board(Base):
    __tablename__ = "board"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    groups: Mapped[List["BoardGroup"]] = relationship(
        "BoardGroup",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="BoardGroup.position",
        lazy="selectin",
    )
    columns: Mapped[List["BoardColumn"]] = relationship(
        "BoardColumn",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="BoardColumn.position",
        lazy="selectin",
    )
    items: Mapped[List["BoardItem"]] = relationship(
        "BoardItem",
        back_populates="board",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class BoardGroup(Base):
    __tablename__ = "board_group"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("board.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    color_hex: Mapped[str] = mapped_column(String(12), nullable=False, default="#4361EE")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_collapsed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    board: Mapped[Board] = relationship("Board", back_populates="groups", lazy="selectin")
    items: Mapped[List["BoardItem"]] = relationship(
        "BoardItem",
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="BoardItem.position",
        lazy="selectin",
    )


class BoardColumn(Base):
    __tablename__ = "board_column"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("board.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    column_type: Mapped[BoardColumnType] = mapped_column(
        SqlEnum(BoardColumnType, values_callable=enum_values),
        nullable=False,
        default=BoardColumnType.TEXT,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    board: Mapped[Board] = relationship("Board", back_populates="columns", lazy="selectin")
    cells: Mapped[List["BoardCell"]] = relationship(
        "BoardCell",
        back_populates="column",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class BoardItem(Base):
    __tablename__ = "board_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("board.id"), nullable=False)
    group_id: Mapped[int] = mapped_column(ForeignKey("board_group.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(STRING_191), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    board: Mapped[Board] = relationship("Board", back_populates="items", lazy="selectin")
    group: Mapped[BoardGroup] = relationship("BoardGroup", back_populates="items", lazy="selectin")
    cells: Mapped[List["BoardCell"]] = relationship(
        "BoardCell",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class BoardCell(Base):
    __tablename__ = "board_cell"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("board_item.id"), nullable=False)
    column_id: Mapped[int] = mapped_column(ForeignKey("board_column.id"), nullable=False)
    raw_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color_hex: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    item: Mapped[BoardItem] = relationship("BoardItem", back_populates="cells")
    column: Mapped[BoardColumn] = relationship("BoardColumn", back_populates="cells")
    comments: Mapped[List["BoardCellComment"]] = relationship(
        "BoardCellComment",
        back_populates="cell",
        cascade="all, delete-orphan",
        order_by="BoardCellComment.created_at",
        lazy="selectin",
    )


class BoardCellComment(Base):
    __tablename__ = "board_cell_comment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cell_id: Mapped[int] = mapped_column(ForeignKey("board_cell.id"), nullable=False)
    author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cell: Mapped[BoardCell] = relationship("BoardCell", back_populates="comments")
    author: Mapped[Optional[User]] = relationship("User")
