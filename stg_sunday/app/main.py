from fastapi import FastAPI, Request, Response
from fastapi.middleware import Middleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

# Importando as rotas
from views.diretos_view import router as diretos_router, ui_router as diretos_ui_router
from views.home_view import router as home_router
from views.contracts_view import router as contracts_router
from views.phases_view import router as phases_router
from views.tasks_view import router as tasks_router
from views.documents_view import router as documents_router
from views.automations_view import router as automations_router
from views.sunday_board_view import router as sunday_router

# Configuração do CORS
cors_middleware = Middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lista de origens permitidas, ajuste conforme necessário
    allow_credentials=True,
    allow_methods=["*"],  # Métodos permitidos
    allow_headers=["*"],  # Cabeçalhos permitidos
)

middlewares = [
    Middleware(
        TrustedHostMiddleware,
        allowed_hosts=['localhost', '0.0.0.0', 'stganalytics.com.br',  'www.stganalytics.com.br', '*']
    ),
    # Middleware(HTTPSRedirectMiddleware)
]

# Adicionando o middleware CORS à lista de middlewares
middlewares.append(cors_middleware)

app = FastAPI(
    docs_url=None,
    redoc_url=None,
    exception_handlers={
    },
    middleware=middlewares
)

# Configuração dos templates
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Configuração de diretórios
UPLOAD_DIRECTORY = "./uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs("media", exist_ok=True)

# Incluindo as rotas
app.include_router(home_router)
app.include_router(contracts_router)
app.include_router(phases_router)
app.include_router(tasks_router)
app.include_router(documents_router)
app.include_router(automations_router)
app.include_router(diretos_ui_router)
app.include_router(diretos_router, prefix="/api")  # Rotas de API legado
app.include_router(sunday_router, prefix="/api")

# Configurando arquivos estáticos
app.mount('/static', StaticFiles(directory='static'), name='static')
app.mount('/media', StaticFiles(directory='media'), name='media')

# Rota raiz que exibe a página inicial
@app.get("/", response_class=Response)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", workers=1, host="0.0.0.0", port=8080, log_level="info", reload=True)
