"""Repositório de dados para o STG Sunday."""

from __future__ import annotations

from typing import Sequence, Optional, Any
from random import choice
import json
from copy import deepcopy

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

DEFAULT_STATUS_LABELS = [
    {"id": "status-new", "text": "Novo", "color": "#4c6ef5"},
    {"id": "status-progress", "text": "Em andamento", "color": "#21d4fd"},
    {"id": "status-done", "text": "Concluído", "color": "#43cea2"},
    {"id": "status-late", "text": "Atrasado", "color": "#ff6b6b"},
]

DEFAULT_COLUMNS = [
    {
        "name": "",
        "column_type": BoardColumnType.STATUS,
        "config": {"labels": DEFAULT_STATUS_LABELS},
    },
    {"name": "", "column_type": BoardColumnType.OBSERVATION},
    {"name": "", "column_type": BoardColumnType.CLIENT},
    {"name": "", "column_type": BoardColumnType.PEOPLE},
    {"name": "", "column_type": BoardColumnType.DATE},
]


def _serialize_config(config: Optional[Any]) -> Optional[str]:
    """Converte dicionários em JSON para persistir em ``config_json``."""
    if config in (None, "", {}):
        return None
    if isinstance(config, str):
        return config
    try:
        return json.dumps(config)
    except (TypeError, ValueError):
        return None


async def _reorder_board_groups(
    session: AsyncSession,
    board_id: int,
    *,
    moved_group: BoardGroup | None = None,
    desired_position: Optional[int] = None,
) -> None:
    stmt = (
        select(BoardGroup)
        .where(BoardGroup.board_id == board_id)
        .order_by(BoardGroup.position.asc(), BoardGroup.id.asc())
    )
    result = await session.execute(stmt)
    groups = result.scalars().all()

    if moved_group is not None:
        groups = [group for group in groups if group.id != moved_group.id]
        insert_at = desired_position if desired_position is not None else len(groups)
        insert_at = max(0, min(insert_at, len(groups)))
        groups.insert(insert_at, moved_group)

    for index, group in enumerate(groups):
        if group.position != index:
            group.position = index

    await session.flush()


async def _reorder_board_columns(
    session: AsyncSession,
    board_id: int,
    *,
    moved_column: BoardColumn | None = None,
    desired_position: Optional[int] = None,
) -> None:
    stmt = (
        select(BoardColumn)
        .where(BoardColumn.board_id == board_id)
        .order_by(BoardColumn.position.asc(), BoardColumn.id.asc())
    )
    result = await session.execute(stmt)
    columns = result.scalars().all()

    if moved_column is not None:
        columns = [column for column in columns if column.id != moved_column.id]
        insert_at = desired_position if desired_position is not None else len(columns)
        insert_at = max(0, min(insert_at, len(columns)))
        columns.insert(insert_at, moved_column)

    for index, column in enumerate(columns):
        if column.position != index:
            column.position = index

    await session.flush()


async def _reorder_group_items(
    session: AsyncSession,
    group_id: int,
    *,
    moved_item: BoardItem | None = None,
    desired_position: Optional[int] = None,
) -> None:
    if group_id is None:
        return

    stmt = (
        select(BoardItem)
        .where(BoardItem.group_id == group_id)
        .order_by(BoardItem.position.asc(), BoardItem.id.asc())
    )
    result = await session.execute(stmt)
    items = result.scalars().all()

    if moved_item is not None:
        items = [item for item in items if item.id != moved_item.id]
        insert_at = desired_position if desired_position is not None else len(items)
        insert_at = max(0, min(insert_at, len(items)))
        items.insert(insert_at, moved_item)

    for index, item in enumerate(items):
        if item.position != index:
            item.position = index

    await session.flush()


# --------------------------------------------------------------------------------------
# Boards
# --------------------------------------------------------------------------------------


async def list_boards(session: AsyncSession) -> Sequence[Board]:
    stmt = select(Board).where(Board.is_archived == False).order_by(Board.created_at.asc())
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_board(session: AsyncSession, board_id: int) -> Board | None:
    stmt = select(Board).where(Board.id == board_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_group(session: AsyncSession, group_id: int) -> BoardGroup | None:
    stmt = select(BoardGroup).where(BoardGroup.id == group_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_column(session: AsyncSession, column_id: int) -> BoardColumn | None:
    stmt = select(BoardColumn).where(BoardColumn.id == column_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_item(session: AsyncSession, item_id: int) -> BoardItem | None:
    stmt = select(BoardItem).where(BoardItem.id == item_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_cell(session: AsyncSession, cell_id: int) -> BoardCell | None:
    stmt = select(BoardCell).where(BoardCell.id == cell_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_board(session: AsyncSession, payload: BoardCreate) -> Board:
    board = Board(**payload.model_dump())
    session.add(board)
    await session.flush()

    for position, column_data in enumerate(DEFAULT_COLUMNS):
        config_payload = column_data.get("config")
        if config_payload is not None:
            config_payload = deepcopy(config_payload)
        column = BoardColumn(
            board_id=board.id,
            name=column_data["name"],
            column_type=column_data["column_type"],
            position=position,
            config_json=_serialize_config(config_payload),
        )
        session.add(column)

    group = BoardGroup(
        board_id=board.id,
        name="",
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


async def archive_board(session: AsyncSession, board: Board, *, archived: bool) -> Board:
    board.is_archived = archived
    await session.flush()
    return board


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

    # Cria itens vazios por padrão para facilitar a edição inicial
    default_titles = [
        "",
        "",
        "",
    ]

    for idx, title in enumerate(default_titles):
        item = BoardItem(
            board_id=board.id,
            group_id=group.id,
            title=title,
            position=idx,
        )
        session.add(item)
        await session.flush()

        for column in board.columns:
            cell = BoardCell(item_id=item.id, column_id=column.id)
            session.add(cell)

    await session.flush()
    return group


async def update_group(session: AsyncSession, group: BoardGroup, payload: BoardGroupUpdate) -> BoardGroup:
    data = payload.model_dump(exclude_unset=True)
    desired_position = data.pop("position", None)

    for field, value in data.items():
        setattr(group, field, value)

    await session.flush()

    if desired_position is not None:
        await _reorder_board_groups(
            session,
            group.board_id,
            moved_group=group,
            desired_position=desired_position,
        )

    return group


async def delete_group(session: AsyncSession, group: BoardGroup) -> None:
    board_id = group.board_id
    await session.delete(group)
    await session.flush()

    await _reorder_board_groups(session, board_id)


# --------------------------------------------------------------------------------------
# Columns
# --------------------------------------------------------------------------------------


async def create_column(session: AsyncSession, board: Board, payload: BoardColumnCreate) -> BoardColumn:
    position = len(board.columns)
    config_payload = payload.config
    if config_payload is None and payload.column_type == BoardColumnType.STATUS:
        config_payload = {"labels": deepcopy(DEFAULT_STATUS_LABELS)}
    elif config_payload is not None:
        config_payload = deepcopy(config_payload)

    column = BoardColumn(
        board_id=board.id,
        name=payload.name,
        column_type=payload.column_type,
        position=position,
        config_json=_serialize_config(config_payload),
    )
    session.add(column)
    await session.flush()

    # Cria células vazias para os itens existentes
    for item in board.items:
        cell = BoardCell(item_id=item.id, column_id=column.id)
        session.add(cell)

    await session.flush()
    return column


async def update_column(session: AsyncSession, column: BoardColumn, payload: BoardColumnUpdate) -> BoardColumn:
    data = payload.model_dump(exclude_unset=True)
    has_config = "config" in data
    config = data.pop("config", None)
    desired_position = data.pop("position", None)

    for field, value in data.items():
        setattr(column, field, value)

    if has_config:
        column.config_json = _serialize_config(deepcopy(config))

    await session.flush()

    if desired_position is not None:
        await _reorder_board_columns(
            session,
            column.board_id,
            moved_column=column,
            desired_position=desired_position,
        )

    return column


async def delete_column(session: AsyncSession, column: BoardColumn) -> None:
    board_id = column.board_id
    await session.delete(column)
    await session.flush()

    await _reorder_board_columns(session, board_id)


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
    original_group_id = item.group_id
    desired_position = data.get("position")

    for field, value in data.items():
        setattr(item, field, value)

    await session.flush()

    if "group_id" in data or "position" in data:
        await _reorder_group_items(
            session,
            item.group_id,
            moved_item=item,
            desired_position=desired_position,
        )
        if "group_id" in data and original_group_id != item.group_id:
            await _reorder_group_items(session, original_group_id)

    return item


async def delete_item(session: AsyncSession, item: BoardItem) -> None:
    group_id = item.group_id
    await session.delete(item)
    await session.flush()

    await _reorder_group_items(session, group_id)


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
