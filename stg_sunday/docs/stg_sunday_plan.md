# STG Sunday – Plano de Evolução

## Visão Geral

A página `diretos/stg-sunday` deve evoluir para uma experiência semelhante ao Monday.com, mantendo o topbar e sidebar originais do Template STG. O objetivo é permitir a gestão de quadros (boards), grupos/tabelas e itens com foco em planejamento semanal.

## Objetivos Funcionais

1. **Topbar**
   - Card horizontal, logo STG Sunday na esquerda.
   - Botões à direita: `Novo quadro`, `Nova tabela`, `Gerenciar tabelas`.
   - Segunda linha com filtros (texto, responsáveis, datas), agrupamentos e ordenação.

2. **Quadro ativo**
   - Lista vertical de grupos (“tabelas”) com nome, cor lateral e contador de itens.
   - Cada grupo pode retrair/expandir.
   - Possibilidade de criar múltiplos grupos no mesmo quadro.

3. **Tabela (grupo)**
   - Colunas customizáveis: texto, status, data, pessoa, número, etiquetas.
   - Botão para adicionar nova coluna; ordenação inline.
   - Células aceitam cores de fundo.

4. **Coluna Observação**
   - Segunda coluna fixa em todas as tabelas.
   - Células abrem uma sidebar/modal à direita para comentários (com usuário + data).
   - Contador de comentários no botão da célula.

5. **Interações adicionais**
   - Seleção de data abre calendário retrátil.
   - Coluna de cliente suporta criação rápida (`+`).
   - Animações suaves para expandir/retrair, hover e toasts.

6. **Backend**
   - Modelagem de quadros, grupos, colunas, itens, células e comentários.
   - Endpoints para CRUD em cada entidade, reorder e toggles (collapse).

## Arquitetura de Dados (proposta)

- `board`: id, name, description, created_at.
- `board_group`: id, board_id, name, color_hex, position, is_collapsed.
- `board_column`: id, board_id, name, type, position, config (JSON).
- `board_item`: id, board_id, group_id, title, position, created_at.
- `board_cell`: id, item_id, column_id, value (TEXT/JSON), color_hex.
- `board_cell_comment`: id, cell_id, author_id, content, created_at.

Tipos de coluna (`Enum`): `text`, `status`, `date`, `people`, `number`, `label`, `client`, `observation`. A coluna `observation` será adicionada automaticamente na posição 2.

## Estrutura do Front-end

- **Template**: `templates/diretos/stg_sunday.html`
  - Topbar card (logo + botões) e linha de ferramentas.
  - Container principal com lista de grupos (cards). Cada grupo contém:
    - Header com cor lateral, nome, contador, ícones (collapse, ações).
    - Tabela horizontal com colunas (`div` grid), linha de títulos e linhas de itens.
    - Footer com botão `+ Nova linha` e `+ Nova coluna`.
- **JS**: `static/src/apps/stg_sunday.js`
  - Fetch inicial (`/api/boards/:id/…`).
  - Render topbar, grupos, colunas, itens.
  - Eventos: criar grupo, reordenar, collapse, abrir modal de observação, adicionar coluna/linha, editar célula.
  - Sidebar/modal para comentários (`#stg-sidebar-comments`).
- **CSS**: `static/src/apps/stg_sunday.css`
  - Layout flex/grid, cores consistentes com STG.
  - Animações `transition` minimalistas.

## Endpoints Planejados (prefixo `/api/sunday`)

- `GET /boards` – listar quadros.
- `POST /boards` – criar quadro.
- `GET /boards/{board_id}` – carregar quadro completo (grupos, colunas, itens, células, comentários resumidos).
- `POST /boards/{board_id}/groups` – criar grupo.
- `PATCH /groups/{group_id}` – atualizar nome/cor/pos/collapse.
- `POST /boards/{board_id}/columns` – nova coluna.
- `PATCH /columns/{column_id}` – atualizar metadados.
- `POST /groups/{group_id}/items` – nova linha.
- `PATCH /items/{item_id}` – mover entre grupos, renomear.
- `POST /cells/{cell_id}` – atualizar valor/cor.
- `GET /cells/{cell_id}/comments` – listar comentários.
- `POST /cells/{cell_id}/comments` – adicionar comentário (usando usuário fictício enquanto não há auth).

## Próximos Passos

1. Atualizar schema (`init_schema.sql`) e modelos SQLAlchemy.
2. Criar repositórios e schemas Pydantic.
3. Implementar endpoints FastAPI no namespace `views/sunday_board_view.py`.
4. Refatorar template/JS/CSS conforme layout definido.
5. Adicionar seed inicial (1 quadro, 2 grupos, colunas padrão, alguns itens).
6. Ajustar testes (manuais ou automatizados) para garantir funcionalidade básica.

