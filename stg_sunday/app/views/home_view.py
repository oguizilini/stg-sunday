"""Módulo de visualizações para a página inicial."""

from fastapi import APIRouter, Request, Response
from fastapi.templating import Jinja2Templates
from pathlib import Path


# Configuração dos templates
BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


router = APIRouter()


@router.get("/", response_class=Response, name="index")
async def home(request: Request):
    """Rota para a página inicial.

    Args:
        request: Objeto de requisição do FastAPI.

    Returns:
        TemplateResponse: Resposta renderizada da página inicial.
    """
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )
