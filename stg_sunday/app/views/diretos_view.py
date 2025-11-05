# --------------------------------------------------------------------------
# MENU - diretos
# --------------------------------------------------------------------------
import os
import json
import logging
from pathlib import Path
from datetime import datetime
from pyexcelerate import Workbook
from fastapi import Response, status, Request
from fastapi.templating import Jinja2Templates
from fastapi.routing import APIRouter


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configuração dos templates
BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

router = APIRouter()
ui_router = APIRouter()


@ui_router.get('/diretos/stg-sunday', response_class=Response, name='stg_sunday')
async def stg_sunday(request: Request):
    """Página principal da plataforma STG Sunday."""

    context = {
        "request": request,
        "page": "STG Sunday",
    }
    return templates.TemplateResponse('diretos/stg_sunday.html', context=context)


@router.get('/relatorios_diretos_fontes_pagadoras', name='fontes_pagadoras')
async def fontes_pagadoras(request: Request):
    # context = await valida_login(request=request)
    # try:
    #     if not context.get('membro'):
    #         return settings.TEMPLATES.TemplateResponse(
    #             'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)
    # except KeyError:
    #     return settings.TEMPLATES.TemplateResponse(
    #         'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)

    context = {
        "request": request,
        "page": "Fontes Pagadoras"
    }
    return templates.TemplateResponse('diretos/fontes_pagadoras.html', context=context)


@router.get('/html_vazio', name='html_vazio')
async def html_vazio(request: Request):
    # context = await valida_login(request=request)
    # try:
    #     if not context.get('membro'):
    #         return settings.TEMPLATES.TemplateResponse(
    #             'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)
    # except KeyError:
    #     return settings.TEMPLATES.TemplateResponse(
    #         'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)

    context = {
        "request": request,
        "page": "HTML VAZIO"
    }
    return templates.TemplateResponse('diretos/html_vazio.html', context=context)


@router.post('/fontes_pagadoras', name='fontes_pagadoras')
async def post_fontes_pagadoras(request: Request):
    # context = await valida_login(request=request)
    # try:
    #     if not context.get('membro'):
    #         return settings.TEMPLATES.TemplateResponse(
    #             'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)
    # except KeyError:
    #     return settings.TEMPLATES.TemplateResponse(
    #         'home/login.html', context=context, status_code=status.HTTP_404_NOT_FOUND)

    # user = context["membro"].username

    user = 'oguizilini'
    try:
        dados = await request.json()

        dados = json.loads(dados['post_data'])
        base = dados.get('base')
        dataagora = datetime.now().strftime("%d%m%Y%H%M%S")


        arq_excel = f'{dados.get("page")}_{base}_{dados.get("userId")}_{dados.get("username")}_{dataagora}.xlsx'

        urlxls = os.path.join(BASE_DIR, f"media/diretos/{arq_excel}")

        if dados.get('tpdoc') == 'CSV':
            df1 = df1.astype("string")
            for col in df1.columns:
                if 'VALOR_' in col or 'VL_' in col or 'SLD_' in col or 'SALDO_' in col:
                    df1[col] = df1[col].astype(str).str.replace('.', ',')

            arq_excel = arq_excel.replace('.xlsx', '.csv')
            urlxls = urlxls.replace('.xlsx', '.csv')

            df1 = df1.replace(';', '')
            df1 = df1.fillna('').astype(str).replace(';', '.', regex=True)
            # df1 = df1.applymap(remover_acentos)
            df1.to_csv(urlxls, sep=';', index=False)
        else:
            try:
                wb = Workbook()
                values = [df1.columns] + list(df1.values)
                wb.new_sheet('sheet name', data=values)
                wb.save(urlxls)
            except Exception as e:
                raise e

        dados['nome_arquivo'] = arq_excel
        dados['total_registros'] = str(len(df1))

        # ren(dados, 'id_user', 'userId')
        # ren(dados, 'cnpj_conta', 'base')
        # ren(dados, 'cliente', 'nomeEmpresa')
        # ren(dados, 'tipo_relatorio', 'page')
        # ren(dados, 'user_name', 'username')
        # dados.pop('idEmpresa')
        # dados.pop('tpdoc') if 'tpdoc' in dados else None

        try:
            columns = ', '.join(dados.keys())
            sql = f"""INSERT INTO ctrl_arq_excel_contabil ({columns}) VALUES {tuple(dados.values())}"""
            # await session.execute(text(sql))
            # await session.commit()
        except Exception as e:
            raise e

        context_ = {
            "data": "Criado com Sucesso",
            "userId": f"{dados['id_user']}",
            "page": f"{dados['tipo_relatorio']}",
            "erro": 0,
            "link": 1,
            "access": user,
            "msg": f"media/diretos/{arq_excel}"
        }

    except Exception as e:
        logger.error(f"Erro no sistema: {e}")
        logger.error(f"Dados: {dados}")

        user = None
        context_ = {
            "access": user,
            "error": 'Acesso negado!'
        }

    return context_


@router.post('/html_vazio', name='html_vazio')
async def html_vazio(request: Request):
    user = 'oguizilini'
    try:
        dados = await request.json()
        
        
    except Exception as e:
        logger.error(f"Erro no sistema: {e}")
        logger.error(f"Dados: {dados}")

        user = None
        context_ = {
            "access": user,
            "error": 'Acesso negado!'
        }

    return context_
