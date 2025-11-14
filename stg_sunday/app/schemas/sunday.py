"""Pydantic schemas para recursos do STG Sunday (boards e tabelas)."""

from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from models.entities import BoardColumnType


class BoardCellCommentOut(BaseModel):
    id: int
    author_id: Optional[int]
    content: str
    created_at: datetime
    is_pinned: bool = False
    author_name: Optional[str] = None
    author_username: Optional[str] = None

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
    config: Optional[dict] = None

    @model_validator(mode="before")
    def _parse_config(cls, values):
        if isinstance(values, BaseModel):
            raw_values = values.model_dump()
        elif isinstance(values, dict):
            raw_values = dict(values)
        else:
            raw_values = {
                "id": getattr(values, "id", None),
                "board_id": getattr(values, "board_id", None),
                "name": getattr(values, "name", None),
                "column_type": getattr(values, "column_type", None),
                "position": getattr(values, "position", None),
                "config_json": getattr(values, "config_json", None),
                "config": getattr(values, "config", None),
            }

        config_json = raw_values.get("config_json")
        if config_json and not raw_values.get("config"):
            try:
                raw_values["config"] = json.loads(config_json)
            except json.JSONDecodeError:
                raw_values["config"] = None
        return raw_values

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
    is_archived: bool
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


class BoardArchiveUpdate(BaseModel):
    archived: bool = Field(True)


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
    config: Optional[dict] = None

    @field_validator("config", mode="before")
    @classmethod
    def _ensure_config(cls, value):
        if isinstance(value, str) and value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return value


class BoardColumnUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=191)
    column_type: Optional[BoardColumnType] = None
    position: Optional[int] = None
    config: Optional[dict] = None

    @field_validator("config", mode="before")
    @classmethod
    def _ensure_config(cls, value):
        if isinstance(value, str) and value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return value


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


class BoardCellCommentUpdate(BaseModel):
    is_pinned: Optional[bool] = None
