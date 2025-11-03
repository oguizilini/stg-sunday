"""Rotas ligadas a tarefas por usuário, contrato e fase."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from core.database import get_session
from repositories import tasks as tasks_repo
from schemas.tasks import TaskCreate, TaskOut, TaskUpdate, TaskListOut


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get("/tasks", response_class=Response, name="tasks_index")
async def tasks_index(request: Request):
    """Página com lista geral de tarefas e filtros."""

    context = {"request": request}
    return templates.TemplateResponse("tasks/index.html", context=context)


@router.get("/tasks/my", response_class=Response, name="tasks_my")
async def tasks_my(request: Request):
    """Página com tarefas atribuídas ao usuário logado."""

    context = {"request": request}
    return templates.TemplateResponse("tasks/my.html", context=context)


@router.get(
    "/api/tasks",
    name="api_tasks_list",
    status_code=status.HTTP_200_OK,
    response_model=TaskListOut,
)
async def api_tasks_list(
    skip: int = 0,
    limit: int = 50,
    assignee_id: int | None = None,
    contract_id: int | None = None,
    session: AsyncSession = Depends(get_session),
) -> TaskListOut:
    """Endpoint API para listar tarefas com filtros."""

    tasks = await tasks_repo.list_tasks(
        session,
        skip=skip,
        limit=limit,
        assignee_id=assignee_id,
        contract_id=contract_id,
    )
    data = [TaskOut.model_validate(task) for task in tasks]
    return TaskListOut(items=data, total=len(data))


@router.post(
    "/api/tasks",
    name="api_tasks_create",
    status_code=status.HTTP_201_CREATED,
)
async def api_tasks_create(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_session),
) -> TaskOut:
    """Endpoint API para criar uma nova tarefa."""

    task = await tasks_repo.create_task(session, payload)
    return TaskOut.model_validate(task)


@router.put(
    "/api/tasks/{task_id}",
    name="api_tasks_update",
    status_code=status.HTTP_200_OK,
)
async def api_tasks_update(
    task_id: int,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_session),
) -> TaskOut:
    """Endpoint API para atualizar uma tarefa."""

    task = await tasks_repo.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")

    task = await tasks_repo.update_task(session, task, payload)
    return TaskOut.model_validate(task)


@router.delete(
    "/api/tasks/{task_id}",
    name="api_tasks_delete",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def api_tasks_delete(
    task_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Endpoint API para remover uma tarefa."""

    task = await tasks_repo.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")

    await tasks_repo.delete_task(session, task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
