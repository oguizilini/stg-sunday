"""Rotas relacionadas ao armazenamento e visualização de documentos."""

from fastapi import APIRouter, Request, Response, status
from fastapi.templating import Jinja2Templates
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get(
    "/contracts/{contract_id}/documents",
    response_class=Response,
    name="documents_index",
)
async def documents_index(request: Request, contract_id: int):
    """Página listando documentos anexados a um contrato."""

    context = {"request": request, "contract_id": contract_id}
    return templates.TemplateResponse("documents/index.html", context=context)


@router.get(
    "/api/contracts/{contract_id}/documents",
    name="api_documents_list",
    status_code=status.HTTP_200_OK,
)
async def api_documents_list(contract_id: int):
    """Endpoint API para listar documentos de um contrato."""

    return {"contract_id": contract_id, "items": []}


@router.post(
    "/api/contracts/{contract_id}/documents",
    name="api_documents_create",
    status_code=status.HTTP_201_CREATED,
)
async def api_documents_create(contract_id: int):
    """Endpoint API para subir um documento."""

    return {"message": "Documento criado", "id": None, "contract_id": contract_id}


@router.delete(
    "/api/contracts/{contract_id}/documents/{document_id}",
    name="api_documents_delete",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def api_documents_delete(contract_id: int, document_id: int):
    """Endpoint API para remover um documento."""

    return Response(status_code=status.HTTP_204_NO_CONTENT)
