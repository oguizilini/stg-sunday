"""Pydantic schemas para recursos do STG Sunday (boards e tabelas)."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from models.entities import BoardColumnType


class BoardCellCommentOut(BaseModel):
    id: int
    author_id: Optional[int]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class BoardCellOut(BaseModel):
    id: int
    column_id: int
    raw_value: Optional[str] = None
    color_hex: Optional[str] = None
    updated_at: datetime
    comments: List[BoardCellCommentOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


class BoardItemOut(BaseModel):
    id: int
    board_id: int
    group_id: int
    title: str
    position: int
    created_at: datetime
    updated_at: datetime
    cells: List[BoardCellOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


class BoardColumnOut(BaseModel):
    id: int
    board_id: int
    name: str
    column_type: BoardColumnType
    position: int
    config_json: Optional[str]

    class Config:
        from_attributes = True


class BoardGroupOut(BaseModel):
    id: int
    board_id: int
    name: str
    color_hex: str
    position: int
    is_collapsed: bool
    created_at: datetime
    updated_at: datetime
    items: List[BoardItemOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


class BoardOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    groups: List[BoardGroupOut] = Field(default_factory=list)
    columns: List[BoardColumnOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------------------
# Payloads
# --------------------------------------------------------------------------------------


class BoardCreate(BaseModel):
    name: str = Field(..., max_length=191)
    description: Optional[str] = None


class BoardUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=191)
    description: Optional[str] = None


class BoardGroupCreate(BaseModel):
    name: str = Field(..., max_length=191)
    color_hex: Optional[str] = Field(None, max_length=12)


class BoardGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=191)
    color_hex: Optional[str] = Field(None, max_length=12)
    position: Optional[int] = None
    is_collapsed: Optional[bool] = None


class BoardColumnCreate(BaseModel):
    name: str = Field(..., max_length=191)
    column_type: BoardColumnType = BoardColumnType.TEXT
    config_json: Optional[str] = None


class BoardColumnUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=191)
    column_type: Optional[BoardColumnType] = None
    position: Optional[int] = None
    config_json: Optional[str] = None


class BoardItemCreate(BaseModel):
    title: str = Field(..., max_length=191)
    group_id: Optional[int] = None


class BoardItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=191)
    group_id: Optional[int] = None
    position: Optional[int] = None


class BoardCellUpdate(BaseModel):
    raw_value: Optional[str] = None
    color_hex: Optional[str] = None


class BoardCellCommentCreate(BaseModel):
    content: str
    author_id: Optional[int] = None
