"""Rotas API para gerenciamento de boards STG Sunday."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from repositories import sunday as repo
from models.entities import BoardGroup
from schemas.sunday import (
    BoardOut,
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


router = APIRouter(prefix="/sunday", tags=["Sunday"])


@router.get("/boards", response_model=List[BoardOut], name="sunday_boards_list")
async def list_boards(session: AsyncSession = Depends(get_session)) -> List[BoardOut]:
    boards = await repo.list_boards(session)
    return [BoardOut.model_validate(board) for board in boards]


@router.post("/boards", response_model=BoardOut, status_code=status.HTTP_201_CREATED, name="sunday_boards_create")
async def create_board(payload: BoardCreate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.create_board(session, payload)
    await session.commit()
    board = await repo.get_board(session, board.id)
    return BoardOut.model_validate(board)


@router.get("/boards/{board_id}", response_model=BoardOut, name="sunday_boards_get")
async def get_board(board_id: int, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    return BoardOut.model_validate(board)


@router.patch("/boards/{board_id}", response_model=BoardOut)
async def update_board(board_id: int, payload: BoardUpdate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    board = await repo.update_board(session, board, payload)
    await session.commit()
    await session.refresh(board)
    return BoardOut.model_validate(board)


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_board(board_id: int, session: AsyncSession = Depends(get_session)) -> Response:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    await repo.delete_board(session, board)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/boards/{board_id}/groups", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
async def create_group(board_id: int, payload: BoardGroupCreate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    board = await repo.get_board(session, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado")
    await repo.create_group(session, board, payload)
    await session.commit()
    board = await repo.get_board(session, board_id)
    return BoardOut.model_validate(board)


@router.patch("/groups/{group_id}", response_model=BoardOut)
async def update_group(group_id: int, payload: BoardGroupUpdate, session: AsyncSession = Depends(get_session)) -> BoardOut:
    from sqlalchemy import select

    result = await session.execute(select(BoardGroup).where(BoardGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")

    board = group.board
    await repo.update_group(session, group, payload)
    await session.commit()
    await session.refresh(board)
    return BoardOut.model_validate(board)


# Endpoints adicionais serão implementados nas próximas etapas (colunas, itens, células etc.)
