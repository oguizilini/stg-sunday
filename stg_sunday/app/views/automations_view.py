"""Rotas para configuração de automações do sistema."""

from fastapi import APIRouter, Request, Response, status
from fastapi.templating import Jinja2Templates
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get("/automations", response_class=Response, name="automations_index")
async def automations_index(request: Request):
    """Página para visualizar e editar automações."""

    context = {"request": request}
    return templates.TemplateResponse("automations/index.html", context=context)


@router.get(
    "/api/automations",
    name="api_automations_list",
    status_code=status.HTTP_200_OK,
)
async def api_automations_list():
    """Endpoint API para listar automações cadastradas."""

    return {"items": [], "total": 0}


@router.post(
    "/api/automations",
    name="api_automations_create",
    status_code=status.HTTP_201_CREATED,
)
async def api_automations_create():
    """Endpoint API para criar uma automação."""

    return {"message": "Automação criada", "id": None}


@router.put(
    "/api/automations/{automation_id}",
    name="api_automations_update",
    status_code=status.HTTP_200_OK,
)
async def api_automations_update(automation_id: int):
    """Endpoint API para atualizar uma automação."""

    return {"message": "Automação atualizada", "id": automation_id}


@router.delete(
    "/api/automations/{automation_id}",
    name="api_automations_delete",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def api_automations_delete(automation_id: int):
    """Endpoint API para excluir uma automação."""

    return Response(status_code=status.HTTP_204_NO_CONTENT)
