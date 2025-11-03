"""Operações de banco para contratos."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entities import Contract
from schemas.contracts import ContractCreate, ContractUpdate


async def list_contracts(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[Contract]:
    stmt = (
        select(Contract)
        .offset(skip)
        .limit(limit)
        .order_by(Contract.created_at.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_contract(session: AsyncSession, contract_id: int) -> Contract | None:
    return await session.get(Contract, contract_id)


async def create_contract(session: AsyncSession, data: ContractCreate) -> Contract:
    contract = Contract(**data.model_dump())
    session.add(contract)
    await session.commit()
    await session.refresh(contract)
    return contract


async def update_contract(
    session: AsyncSession,
    contract: Contract,
    data: ContractUpdate,
) -> Contract:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contract, field, value)

    await session.commit()
    await session.refresh(contract)
    return contract


async def delete_contract(session: AsyncSession, contract: Contract) -> None:
    await session.delete(contract)
    await session.commit()
