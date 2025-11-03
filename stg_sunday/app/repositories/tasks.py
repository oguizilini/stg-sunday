"""Operações de banco para tarefas."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entities import Task
from schemas.tasks import TaskCreate, TaskUpdate


async def list_tasks(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
    assignee_id: int | None = None,
    contract_id: int | None = None,
) -> Sequence[Task]:
    stmt = select(Task).order_by(Task.created_at.desc())

    if assignee_id is not None:
        stmt = stmt.where(Task.assigned_to_user_id == assignee_id)
    if contract_id is not None:
        stmt = stmt.where(Task.contract_id == contract_id)

    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_task(session: AsyncSession, task_id: int) -> Task | None:
    return await session.get(Task, task_id)


async def create_task(session: AsyncSession, data: TaskCreate) -> Task:
    task = Task(**data.model_dump())
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def update_task(session: AsyncSession, task: Task, data: TaskUpdate) -> Task:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await session.commit()
    await session.refresh(task)
    return task


async def delete_task(session: AsyncSession, task: Task) -> None:
    await session.delete(task)
    await session.commit()

