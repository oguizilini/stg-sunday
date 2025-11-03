"""Rotas relacionadas a contratos e visão geral."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from core.database import get_session
from repositories import contracts as contracts_repo
from schemas.contracts import ContractCreate, ContractOut, ContractUpdate, ContractListOut


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get("/contracts", response_class=Response, name="contracts_index")
async def contracts_index(request: Request):
    """Página com a lista de contratos e filtros básicos."""

    context = {"request": request}
    return templates.TemplateResponse("contracts/index.html", context=context)


@router.get("/contracts/new", response_class=Response, name="contracts_new")
async def contracts_new(request: Request):
    """Página para criar um novo contrato."""

    context = {"request": request}
    return templates.TemplateResponse("contracts/new.html", context=context)


@router.get("/contracts/{contract_id}", response_class=Response, name="contracts_detail")
async def contracts_detail(request: Request, contract_id: int):
    """Página de detalhes e edição de um contrato específico."""

    context = {"request": request, "contract_id": contract_id}
    return templates.TemplateResponse("contracts/detail.html", context=context)


@router.get(
    "/api/contracts",
    name="contracts_list",
    status_code=status.HTTP_200_OK,
    response_model=ContractListOut,
)
async def api_contracts_list(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
) -> ContractListOut:
    """Endpoint API para listar contratos com dados básicos."""

    contracts = await contracts_repo.list_contracts(session, skip=skip, limit=limit)
    data = [ContractOut.model_validate(contract) for contract in contracts]
    return ContractListOut(items=data, total=len(data))


@router.post("/api/contracts", name="contracts_create", status_code=status.HTTP_201_CREATED)
async def api_contracts_create(
    payload: ContractCreate,
    session: AsyncSession = Depends(get_session),
) -> ContractOut:
    """Endpoint API para criar um contrato."""

    contract = await contracts_repo.create_contract(session, payload)
    return ContractOut.model_validate(contract)


@router.get("/api/contracts/{contract_id}", name="contracts_get", status_code=status.HTTP_200_OK)
async def api_contracts_get(
    contract_id: int,
    session: AsyncSession = Depends(get_session),
) -> ContractOut:
    """Endpoint API para obter dados de um contrato específico."""

    contract = await contracts_repo.get_contract(session, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado")

    return ContractOut.model_validate(contract)


@router.put("/api/contracts/{contract_id}", name="contracts_update", status_code=status.HTTP_200_OK)
async def api_contracts_update(
    contract_id: int,
    payload: ContractUpdate,
    session: AsyncSession = Depends(get_session),
) -> ContractOut:
    """Endpoint API para atualizar um contrato."""

    contract = await contracts_repo.get_contract(session, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado")

    contract = await contracts_repo.update_contract(session, contract, payload)
    return ContractOut.model_validate(contract)


@router.delete("/api/contracts/{contract_id}", name="contracts_delete", status_code=status.HTTP_204_NO_CONTENT)
async def api_contracts_delete(
    contract_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Endpoint API para excluir um contrato."""

    contract = await contracts_repo.get_contract(session, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado")

    await contracts_repo.delete_contract(session, contract)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
