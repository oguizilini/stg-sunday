"""Rotas API para gerenciamento de boards STG Sunday."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from repositories import sunday as repo
from schemas.sunday import (
    BoardOut,
    BoardCreate,
    BoardUpdate,
    BoardArchiveUpdate,
    BoardGroupCreate,
    BoardGroupUpdate,
    BoardColumnCreate,
    BoardColumnUpdate,
    BoardItemCreate,
    BoardItemUpdate,
    BoardCellUpdate,
    BoardCellCommentCreate,
    BoardCellCommentUpdate,
    BoardCellOut,
    BoardCellCommentOut,
)


router = APIRouter(prefix="/sunday", tags=["Sunday"])


def _board_to_schema(board) -> BoardOut:
    return BoardOut.model_validate(board, from_attributes=True)


@router.get("/boards", response_model=List[BoardOut], name="sunday_boards_list")
async def list_boards(session: AsyncSession = Depends(get_session)) -> List[BoardOut]:
    boards = await repo.list_boards(session)
    return [_board_to_schema(board) for board in boards]


@router.post("/boards", response_model=BoardOut, status_code=status.HTTP_201_CREATED, name="sunday_boards_create")
async def create_board(payload: BoardCreate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.create_board(session, payload)
    await session.commit()
    board = await repo.get_board(session, board.id)
    return _board_to_schema(board)


@router.get("/boards/{board_id}", response_model=BoardOut, name="sunday_boards_get")
async def get_board(board_id: int, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    return _board_to_schema(board)


@router.patch("/boards/{board_id}", response_model=BoardOut)
async def update_board(board_id: int, payload: BoardUpdate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    board = await repo.update_board(session, board, payload)
    await session.commit()
    await session.refresh(board)
    return _board_to_schema(board)


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_board(board_id: int, session: AsyncSession = Depends(get_session)) -> Response:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    await repo.delete_board(session, board)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/boards/{board_id}/archive", response_model=BoardOut, name="sunday_boards_archive")
async def archive_board_route(
    board_id: int,
    payload: BoardArchiveUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")

    board = await repo.archive_board(session, board, archived=payload.archived)
    await session.commit()
    await session.refresh(board)
    return _board_to_schema(board)


@router.post("/boards/{board_id}/groups", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
async def create_group(board_id: int, payload: BoardGroupCreate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    await repo.create_group(session, board, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.patch("/groups/{group_id}", response_model=BoardOut)
async def update_group(
    group_id: int,
    payload: BoardGroupUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    group = await repo.get_group(session, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")

    await repo.update_group(session, group, payload)
    await session.commit()
    board = await repo.get_board(session, group.board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    return _board_to_schema(board)


@router.delete("/groups/{group_id}", response_model=BoardOut)
async def delete_group(
    group_id: int,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    group = await repo.get_group(session, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")

    board_id = group.board_id
    await repo.delete_group(session, group)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.post(
    "/boards/{board_id}/columns",
    response_model=BoardOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_column(
    board_id: int,
    payload: BoardColumnCreate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")

    await repo.create_column(session, board, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.patch("/columns/{column_id}", response_model=BoardOut)
async def update_column(
    column_id: int,
    payload: BoardColumnUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    column = await repo.get_column(session, column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coluna não encontrada")

    board_id = column.board_id
    await repo.update_column(session, column, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.delete("/columns/{column_id}", response_model=BoardOut)
async def delete_column(
    column_id: int,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    column = await repo.get_column(session, column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coluna não encontrada")

    board_id = column.board_id
    await repo.delete_column(session, column)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.post(
    "/boards/{board_id}/items",
    response_model=BoardOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    board_id: int,
    payload: BoardItemCreate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")

    if payload.group_id and not any(group.id == payload.group_id for group in board.groups):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grupo inválido para este quadro")

    await repo.create_item(session, board, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.patch("/items/{item_id}", response_model=BoardOut)
async def update_item(
    item_id: int,
    payload: BoardItemUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    item = await repo.get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")

    board_id = item.board_id
    await repo.update_item(session, item, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.delete("/items/{item_id}", response_model=BoardOut)
async def delete_item(
    item_id: int,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    item = await repo.get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")

    board_id = item.board_id
    await repo.delete_item(session, item)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return _board_to_schema(board)


@router.patch("/cells/{cell_id}", response_model=BoardCellOut)
async def update_cell(
    cell_id: int,
    payload: BoardCellUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardCellOut:
    cell = await repo.get_cell(session, cell_id)
    if not cell:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Célula não encontrada")

    await repo.update_cell(session, cell, payload)
    await session.commit()
    await session.refresh(cell)
    return BoardCellOut.model_validate(cell, from_attributes=True)


@router.post(
    "/cells/{cell_id}/comments",
    response_model=BoardCellCommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    cell_id: int,
    payload: BoardCellCommentCreate,
    session: AsyncSession = Depends(get_session),
) -> BoardCellCommentOut:
    cell = await repo.get_cell(session, cell_id)
    if not cell:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Célula não encontrada")

    comment = await repo.create_comment(session, cell, payload)
    await session.commit()
    await session.refresh(comment)
    return BoardCellCommentOut.model_validate(comment, from_attributes=True)


@router.patch(
    "/cells/{cell_id}/comments/{comment_id}",
    response_model=BoardCellCommentOut,
)
async def update_comment(
    cell_id: int,
    comment_id: int,
    payload: BoardCellCommentUpdate,
    session: AsyncSession = Depends(get_session),
) -> BoardCellCommentOut:
    comment = await repo.get_comment(session, comment_id)
    if not comment or comment.cell_id != cell_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentário não encontrado")
    if not payload.model_fields_set:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhuma alteração informada")
    await repo.update_comment(session, comment, payload)
    await session.commit()
    await session.refresh(comment)
    return BoardCellCommentOut.model_validate(comment, from_attributes=True)


@router.delete(
    "/cells/{cell_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_comment(
    cell_id: int,
    comment_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    comment = await repo.get_comment(session, comment_id)
    if not comment or comment.cell_id != cell_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentário não encontrado")
    await repo.delete_comment(session, comment)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
