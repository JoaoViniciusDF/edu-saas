from fastapi import APIRouter

from app.controllers.AvaliacoesController import router as avaliacoes_router
from app.controllers.ComunicadosController import router as comunicados_router
from app.controllers.ConfiguracoesController import router as configuracoes_router
from app.controllers.ConteudoController import router as conteudo_router
from app.controllers.DashboardController import router as dashboard_router

api_router = APIRouter()
api_router.include_router(configuracoes_router)
api_router.include_router(avaliacoes_router)
api_router.include_router(conteudo_router)
api_router.include_router(comunicados_router)
api_router.include_router(dashboard_router)
