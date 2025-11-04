"""Seed mínimo de dados para STG Sunday.

Executa criação das tabelas (se necessário) e insere:
- 1 usuário demo
- 1 contrato de exemplo
- 1 fase do contrato
- 2 tarefas vinculadas

Uso:
  cd stg_sunday/app
  python -m scripts.seed
"""

from __future__ import annotations

import asyncio
from datetime import date, timedelta

from sqlalchemy import select, text

from core.database import AsyncSessionLocal, init_db
from models.entities import (
    User,
    Contract,
    ContractPhase,
    Task,
    TaskStatus,
    Board,
    BoardGroup,
    BoardColumn,
    BoardItem,
    BoardCell,
    BoardColumnType,
)


async def seed() -> None:
    # Garante que as tabelas existem (idempotente)
    await init_db()

    async with AsyncSessionLocal() as session:
        # Usuário demo
        result = await session.execute(select(User).where(User.username == "demo"))
        user = result.scalars().first()
        if not user:
            user = User(
                username="demo",
                email="demo@example.com",
                password_hash="demo",
                is_active=1,
            )
            session.add(user)
            await session.flush()

        # Contrato demo
        result = await session.execute(select(Contract).where(Contract.title == "Contrato Demo"))
        contract = result.scalars().first()
        if not contract:
            contract = Contract(
                title="Contrato Demo",
                description="Contrato de exemplo para validação da interface",
                client_id=user.id,
                assigned_user_id=user.id,
                start_date=date.today(),
            )
            session.add(contract)
            await session.flush()

        # Fase do contrato
        result = await session.execute(
            select(ContractPhase).where(
                (ContractPhase.contract_id == contract.id)
                & (ContractPhase.phase_order == 1)
            )
        )
        phase = result.scalars().first()
        if not phase:
            phase = ContractPhase(
                contract_id=contract.id,
                phase_name="Início",
                phase_order=1,
                responsible_user_id=user.id,
            )
            session.add(phase)
            await session.flush()

        # Tarefas
        result = await session.execute(
            select(Task).where((Task.contract_id == contract.id))
        )
        existing_tasks = result.scalars().all()
        if not existing_tasks:
            t1 = Task(
                contract_id=contract.id,
                phase_id=phase.id,
                description="Configurar ambiente",
                assigned_to_user_id=user.id,
                due_date=date.today() + timedelta(days=2),
                status=TaskStatus.NEW,
            )
            t2 = Task(
                contract_id=contract.id,
                phase_id=phase.id,
                description="Criar primeira automação",
                assigned_to_user_id=user.id,
                due_date=date.today() + timedelta(days=5),
                status=TaskStatus.IN_PROGRESS,
            )
            t3 = Task(
                contract_id=contract.id,
                phase_id=phase.id,
                description="Revisar contrato com jurídico",
                assigned_to_user_id=user.id,
                due_date=date.today() - timedelta(days=1),
                status=TaskStatus.LATE,
            )
            session.add_all([t1, t2, t3])

        await session.commit()

    await seed_boards()
    print("Seed concluído.")


async def seed_boards() -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM board_cell_comment"))
        await session.execute(text("DELETE FROM board_cell"))
        await session.execute(text("DELETE FROM board_item"))
        await session.execute(text("DELETE FROM board_column"))
        await session.execute(text("DELETE FROM board_group"))
        await session.execute(text("DELETE FROM board"))

        result = await session.execute(select(Board).limit(1))
        existing_board = result.scalar_one_or_none()
        if existing_board:
            return

        board = Board(name="Planejamento Fiscal", description="Quadro inicial inspirado no Monday.com")
        session.add(board)
        await session.flush()

        grupos = [
            ("Em operacionalização", "#21d4fd"),
        ]

        group_models: list[BoardGroup] = []
        for position, (nome, cor) in enumerate(grupos):
            group = BoardGroup(
                board_id=board.id,
                name=nome,
                color_hex=cor,
                position=position,
            )
            session.add(group)
            group_models.append(group)
        await session.flush()

        columns_data = [
            ("Status", BoardColumnType.STATUS),
            ("Observação", BoardColumnType.OBSERVATION),
            ("Cliente", BoardColumnType.CLIENT),
            ("Responsável", BoardColumnType.PEOPLE),
            ("Prazo", BoardColumnType.DATE),
        ]

        column_models: list[BoardColumn] = []
        for position, (name, column_type) in enumerate(columns_data):
            column = BoardColumn(
                board_id=board.id,
                name=name,
                column_type=column_type,
                position=position,
            )
            session.add(column)
            column_models.append(column)
        await session.flush()

        itens_demo = [
            (group_models[0], "Processar planilhas de crédito"),
            (group_models[0], "Enviar documentação complementar"),
            (group_models[0], "Coletar assinaturas pendentes"),
        ]

        status_map = {
            BoardColumnType.STATUS: "Em andamento",
            BoardColumnType.CLIENT: "Cliente Demo",
            BoardColumnType.PEOPLE: "Equipe Fiscal",
            BoardColumnType.DATE: date.today().isoformat(),
        }

        for position, (group_model, title) in enumerate(itens_demo):
            item = BoardItem(
                board_id=board.id,
                group_id=group_model.id,
                title=title,
                position=position,
            )
            session.add(item)
            await session.flush()

            for column in column_models:
                raw_value = status_map.get(column.column_type, "")
                cell = BoardCell(
                    item_id=item.id,
                    column_id=column.id,
                    raw_value=raw_value if raw_value else None,
                )
                session.add(cell)

        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
