"""Rotas para gerenciamento das fases dos contratos."""

from fastapi import APIRouter, Request, Response, status
from fastapi.templating import Jinja2Templates
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get(
    "/contracts/{contract_id}/phases",
    response_class=Response,
    name="contract_phases_index",
)
async def contract_phases_index(request: Request, contract_id: int):
    """Página que apresenta o fluxo de fases de um contrato."""

    context = {"request": request, "contract_id": contract_id}
    return templates.TemplateResponse("phases/index.html", context=context)


@router.get(
    "/contracts/{contract_id}/phases/designer",
    response_class=Response,
    name="contract_phases_designer",
)
async def contract_phases_designer(request: Request, contract_id: int):
    """Página para configurar e ordenar fases do contrato."""

    context = {"request": request, "contract_id": contract_id}
    return templates.TemplateResponse("phases/designer.html", context=context)


@router.get(
    "/api/contracts/{contract_id}/phases",
    name="api_contract_phases_list",
    status_code=status.HTTP_200_OK,
)
async def api_contract_phases_list(contract_id: int):
    """Endpoint API para listar fases de um contrato."""

    return {"contract_id": contract_id, "items": []}


@router.post(
    "/api/contracts/{contract_id}/phases",
    name="api_contract_phases_create",
    status_code=status.HTTP_201_CREATED,
)
async def api_contract_phases_create(contract_id: int):
    """Endpoint API para criar uma fase."""

    return {"message": "Fase criada", "id": None, "contract_id": contract_id}


@router.put(
    "/api/contracts/{contract_id}/phases/{phase_id}",
    name="api_contract_phases_update",
    status_code=status.HTTP_200_OK,
)
async def api_contract_phases_update(contract_id: int, phase_id: int):
    """Endpoint API para atualizar dados de uma fase."""

    return {
        "message": "Fase atualizada",
        "id": phase_id,
        "contract_id": contract_id,
    }


@router.delete(
    "/api/contracts/{contract_id}/phases/{phase_id}",
    name="api_contract_phases_delete",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def api_contract_phases_delete(contract_id: int, phase_id: int):
    """Endpoint API para remover uma fase."""

    return Response(status_code=status.HTTP_204_NO_CONTENT)
