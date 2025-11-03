"""Modelos Pydantic para contratos."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field

from models.entities import ContractStatus


class ContractBase(BaseModel):
    title: str = Field(..., max_length=191)
    description: Optional[str] = None
    status: ContractStatus = ContractStatus.DRAFT
    contract_type: Optional[str] = Field(None, max_length=191)
    client_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[Decimal] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=191)
    description: Optional[str] = None
    status: Optional[ContractStatus] = None
    contract_type: Optional[str] = Field(None, max_length=191)
    client_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[Decimal] = None


class ContractOut(BaseModel):
    id: int
    title: str
    status: ContractStatus
    contract_type: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    value: Optional[Decimal]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractListOut(BaseModel):
    items: List[ContractOut]
    total: int
