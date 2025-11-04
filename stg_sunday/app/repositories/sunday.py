"""Repositório de dados para o STG Sunday."""

from __future__ import annotations

from typing import Sequence
from random import choice

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entities import (
    Board,
    BoardGroup,
    BoardColumn,
    BoardItem,
    BoardCell,
    BoardCellComment,
    BoardColumnType,
)
from schemas.sunday import (
    BoardCreate,
    BoardUpdate,
    BoardGroupCreate,
    BoardGroupUpdate,
    BoardColumnCreate,
    BoardColumnUpdate,
    BoardItemCreate,
    BoardItemUpdate,
    BoardCellUpdate,
    BoardCellCommentCreate,
)

GROUP_COLORS = [
    "#4361EE",
    "#21d4fd",
    "#ff7b89",
    "#ffce45",
    "#7b6cff",
    "#43cea2",
]

DEFAULT_COLUMNS = [
    ("Status", BoardColumnType.STATUS),
    ("Observação", BoardColumnType.OBSERVATION),
    ("Cliente", BoardColumnType.CLIENT),
    ("Responsável", BoardColumnType.PEOPLE),
    ("Prazo", BoardColumnType.DATE),
]


# --------------------------------------------------------------------------------------
# Boards
# --------------------------------------------------------------------------------------


async def list_boards(session: AsyncSession) -> Sequence[Board]:
    stmt = select(Board).order_by(Board.created_at.asc())
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_board(session: AsyncSession, board_id: int) -> Board | None:
    stmt = select(Board).where(Board.id == board_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_board(session: AsyncSession, payload: BoardCreate) -> Board:
    board = Board(**payload.model_dump())
    session.add(board)
    await session.flush()

    for position, (name, column_type) in enumerate(DEFAULT_COLUMNS):
        column = BoardColumn(
            board_id=board.id,
            name=name,
            column_type=column_type,
            position=position,
        )
        session.add(column)

    group = BoardGroup(
        board_id=board.id,
        name="Nova tabela",
        color_hex=choice(GROUP_COLORS),
        position=0,
    )
    session.add(group)

    await session.flush()
    await session.refresh(board)
    return board


async def update_board(session: AsyncSession, board: Board, payload: BoardUpdate) -> Board:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(board, field, value)
    await session.flush()
    return board


async def delete_board(session: AsyncSession, board: Board) -> None:
    await session.delete(board)
    await session.flush()


# --------------------------------------------------------------------------------------
# Groups
# --------------------------------------------------------------------------------------


async def create_group(session: AsyncSession, board: Board, payload: BoardGroupCreate) -> BoardGroup:
    position = len(board.groups)
    group = BoardGroup(
        board_id=board.id,
        name=payload.name,
        color_hex=payload.color_hex or choice(GROUP_COLORS),
        position=position,
    )
    session.add(group)
    await session.flush()
    return group


async def update_group(session: AsyncSession, group: BoardGroup, payload: BoardGroupUpdate) -> BoardGroup:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    await session.flush()
    return group


async def delete_group(session: AsyncSession, group: BoardGroup) -> None:
    await session.delete(group)
    await session.flush()


# --------------------------------------------------------------------------------------
# Columns
# --------------------------------------------------------------------------------------


async def create_column(session: AsyncSession, board: Board, payload: BoardColumnCreate) -> BoardColumn:
    position = len(board.columns)
    column = BoardColumn(
        board_id=board.id,
        name=payload.name,
        column_type=payload.column_type,
        position=position,
        config_json=payload.config_json,
    )
    session.add(column)
    await session.flush()
    return column


async def update_column(session: AsyncSession, column: BoardColumn, payload: BoardColumnUpdate) -> BoardColumn:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(column, field, value)
    await session.flush()
    return column


async def delete_column(session: AsyncSession, column: BoardColumn) -> None:
    await session.delete(column)
    await session.flush()


# --------------------------------------------------------------------------------------
# Items e células
# --------------------------------------------------------------------------------------


async def create_item(session: AsyncSession, board: Board, payload: BoardItemCreate) -> BoardItem:
    group_id = payload.group_id or board.groups[0].id  # fallback simples
    position_stmt = select(BoardItem).where(BoardItem.group_id == group_id)
    existing = await session.execute(position_stmt)
    position = len(existing.scalars().all())

    item = BoardItem(
        board_id=board.id,
        group_id=group_id,
        title=payload.title,
        position=position,
    )
    session.add(item)
    await session.flush()

    # Cria células vazias
    for column in board.columns:
        cell = BoardCell(item_id=item.id, column_id=column.id)
        session.add(cell)

    await session.flush()
    return item


async def update_item(session: AsyncSession, item: BoardItem, payload: BoardItemUpdate) -> BoardItem:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(item, field, value)
    await session.flush()
    return item


async def delete_item(session: AsyncSession, item: BoardItem) -> None:
    await session.delete(item)
    await session.flush()


async def update_cell(session: AsyncSession, cell: BoardCell, payload: BoardCellUpdate) -> BoardCell:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cell, field, value)
    await session.flush()
    return cell


async def create_comment(session: AsyncSession, cell: BoardCell, payload: BoardCellCommentCreate) -> BoardCellComment:
    comment = BoardCellComment(
        cell_id=cell.id,
        author_id=payload.author_id,
        content=payload.content,
    )
    session.add(comment)
    await session.flush()
    return comment
