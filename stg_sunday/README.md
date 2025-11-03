# STG Sunday — Guia de Desenvolvimento

Este documento define regras e práticas para desenvolver a plataforma interna de gestão de tarefas (estilo monday.com) STG Sunday, utilizando FastAPI, Jinja2 e assets estáticos já providos. O banco de dados alvo é MySQL 5.7 com `CHARSET=latin1` e `COLLATE=latin1_swedish_ci`.

## Visão Geral da Pasta

- App FastAPI com templates Jinja2.
- Front-end baseado em tema (CSS/JS) já empacotado em `static`.
- Estrutura principal:
  - `app/main.py`: inicialização do FastAPI, montagem de estáticos e templates, inclusão de rotas.
  - `views/`: controladores (APIRouter) por domínio. Ex.: `home_view.py`, `diretos_view.py`.
  - `templates/`: Jinja2 (`base.html`, `index.html`, páginas/menus). Padrão de herança com blocks.
  - `static/`: vendors, plugins, css/js e imagens.
  - `logs/`: arquivos de log (apenas para referência local).

## Convenções de Projeto

- Linguagem: Python 3.10+.
- Framework: FastAPI + Jinja2 para server-side rendering.
- Organização por domínio/feature:
  - Rota/controle: `views/<feature>_view.py` com `APIRouter`.
  - Templates: `templates/<feature>/...` e páginas herdando `templates/base.html`.
  - Estáticos: `static/src/...` seguindo a estrutura já existente (plugins e css do tema).
- Prefixos de rota:
  - Páginas (SSR): rotas sem prefixo especial (ex.: `/`, `/minha-pagina`).
  - API: prefixo `/api` (ex.: `/api/tasks`, `/api/users`).
- Nomes e padrões:
  - Rotas e caminhos: kebab-case nos paths, snake_case no código Python.
  - Tabelas e colunas no MySQL: snake_case, singular para tabelas de junção (ex.: `task_user`).
  - Chaves primárias: `id` inteiro autoincremento.
  - FKs: `fk_<tabela>_<coluna>`.
- Templates Jinja:
  - Sempre estender `base.html` e usar blocks: `import_css`, `header`, `body`, `container`, `import_js`, `tablelist`, `urlWebSocket`, `scriptJS`.
  - Importar assets com `url_for('static', path='...')` para evitar paths quebrados.

## Banco de Dados — MySQL 5.7 (latin1)

- Charset/Collation padrão do schema e tabelas:
  - `CHARSET=latin1 COLLATE=latin1_swedish_ci`.
- Conexão (SQLAlchemy, exemplos):
  - Sync: `mysql+mysqlclient://user:pass@host:3306/dbname?charset=latin1`
  - Async: `mysql+asyncmy://user:pass@host:3306/dbname?charset=latin1`
- Regras de modelagem:
  - Evitar emojis e caracteres fora do conjunto Latin-1 (usar transliteração/slug quando necessário).
  - Strings usar `VARCHAR` com tamanhos adequados (ex.: `VARCHAR(191)` quando precisar de índices em colunas com UNIQUE para compatibilidade com limites antigos de índice).
  - Textos longos: `TEXT` (latin1); avaliar compressão lógica na aplicação, se necessário.
  - Datas: `DATETIME(6)` quando precisar de microssegundos, senão `DATETIME`.
  - Números monetários: `DECIMAL(18,2)` ou conforme regra do domínio.
- Criação de schema e tabela (exemplo):
  ```sql
  CREATE DATABASE IF NOT EXISTS stg_tasks
    DEFAULT CHARACTER SET latin1
    DEFAULT COLLATE latin1_swedish_ci;

  USE stg_tasks;

  CREATE TABLE IF NOT EXISTS task (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(191) NOT NULL,
      description TEXT NULL,
      status ENUM('novo','em_andamento','concluido','bloqueado') NOT NULL DEFAULT 'novo',
      assignee_id INT UNSIGNED NULL,
      due_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_task_status (status),
      KEY idx_task_due_date (due_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
  ```
- Migração de charset/collation (quando trazendo tabelas existentes):
  ```sql
  ALTER TABLE minha_tabela CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci;
  ```
- Boas práticas MySQL 5.7:
  - Ativar `sql_safe_updates=0` apenas em scripts controlados; preferir transações explícitas.
  - Ajustar pool de conexões (ex.: `pool_pre_ping=True`, timeouts explícitos) para evitar erros de desconexão.

## Padrão de Camadas

- Views (controladores): regras de roteamento, parsing de request e resposta.
- Services/Regras de negócio (opcional): funções puras para regras da aplicação.
- Repositórios (opcional): acesso ao banco via SQLAlchemy/Core.
- Templates: renderização final para HTML.

## Como Criar uma Nova Feature

1) Rotas
- Criar `views/tasks_view.py` com um `APIRouter`. Exemplo:
```python
from fastapi import APIRouter, Request, Response
from fastapi.templating import Jinja2Templates
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / 'templates'))

router = APIRouter()

@router.get('/tasks', response_class=Response, name='tasks_index')
async def tasks_index(request: Request):
    return templates.TemplateResponse('tasks/index.html', {'request': request})

@router.get('/api/tasks', name='tasks_list')
async def tasks_list():
    return {'items': []}
```
- Incluir o router em `main.py` com `app.include_router(tasks_view.router, prefix='')` e manter APIs sob `/api` quando necessário.

2) Templates
- Criar `templates/tasks/index.html` estendendo `base.html` e incluindo assets com `url_for('static', ...)`.

3) Estáticos (se necessário)
- Adicionar JS/CSS específicos em `static/src/...` seguindo padrões do tema (por exemplo, datatables, sweetalerts, etc.).

4) Banco de Dados
- Criar tabela(s) com `CHARSET=latin1` e `COLLATE=latin1_swedish_ci`.
- Implementar repositório SQLAlchemy com conexão declarando `?charset=latin1` no DSN.

## Padrões de Código (Python)

- Formatação: PEP8 (black/ruff opcionais, se adicionados ao projeto).
- Linters: evitar imports não utilizados; funções curtas e focadas.
- Logging: usar `logging` e centralizar arquivos de log (pasta `logs/`). Não versionar logs.
- Nomes:
  - Módulos: `snake_case`.
  - Classes: `PascalCase`.
  - Funções/variáveis: `snake_case`.

## Segurança e Configuração

- CORS: revisar origens na inicialização (`allow_origins`) antes de ir para produção.
- Trusted hosts: manter lista em `TrustedHostMiddleware` condizente com o ambiente.
- Variáveis de ambiente:
  - `DATABASE_URL` (ex.: `mysql+mysqlclient://user:pass@host:3306/db?charset=latin1`).
  - `ENV` (`dev`, `hom`, `prod`).

## WebSockets e Tempo Real

- O template provê estrutura de WebSocket no `base.html` para logs/updates em tempo real.
- Padrão de endpoint: `ws://<host>/<caminho-definido-no-template>/<client_id>`.
- Para novas streams, padronizar namespace sob `/api/trigger/ws/...` e documentar os eventos.

## Execução (Desenvolvimento)

- Comandos (exemplos):
  - `cd app && uvicorn main:app --host 0.0.0.0 --port 8080 --reload`
- Estrutura de montagem (já presente):
  - Estáticos: montados em `/static` e `/media`.
  - Templates: `templates/` com `Jinja2Templates`.

## Boas Práticas com latin1

- Normalize acentos quando necessário para filtros/pesquisas (funções no front já usam normalização para busca no menu).
- Evitar caracteres fora de Latin-1; para nomes/títulos, considerar sanitização.
- Testar importação/exportação CSV garantindo `;` como separador e encoding latin1 quando requerido por sistemas legados.

## Exemplo de Tabela Core (Tasks)

Use como base para a plataforma de tarefas:
```sql
CREATE TABLE IF NOT EXISTS board (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS task (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id INT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status ENUM('novo','em_andamento','concluido','bloqueado') NOT NULL DEFAULT 'novo',
  assignee_id INT UNSIGNED NULL,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_board (board_id),
  CONSTRAINT fk_task_board_id FOREIGN KEY (board_id) REFERENCES board(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
```

## Checklist de PRs

- [ ] Templates estendem `base.html` e usam blocks corretos.
- [ ] Rotas SSR e APIs organizadas e versionadas quando necessário.
- [ ] DDL compatível com MySQL 5.7 + latin1; sem dependência de `utf8mb4`.
- [ ] Nomes e índices seguindo padrões.
- [ ] Logs não versionados; credenciais via ambiente.

---

Dúvidas ou ajustes de padrão? Centralizar discussões e decisões neste README para manter o alinhamento entre times.
