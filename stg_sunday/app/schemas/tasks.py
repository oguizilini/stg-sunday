"""Modelos Pydantic para tarefas."""

from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from models.entities import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    description: str = Field(..., max_length=191)
    details: Optional[str] = None
    contract_id: int
    phase_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None
    due_date: Optional[date] = None
    status: TaskStatus = TaskStatus.NEW
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=191)
    details: Optional[str] = None
    phase_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskOut(BaseModel):
    id: int
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    contract_id: int
    phase_id: Optional[int]

    class Config:
        from_attributes = True


class TaskListOut(BaseModel):
    items: List[TaskOut]
    total: int
