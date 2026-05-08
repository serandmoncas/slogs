from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, bodegas, clientes, dashboard, envios, export, productos, puertos

app = FastAPI(
    title="SLOGS — Siata Logistics API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth.router,
    clientes.router,
    productos.router,
    bodegas.router,
    puertos.router,
    envios.router,
    export.router,
    dashboard.router,
]:
    app.include_router(router, prefix="/api/v1")


@app.get("/")
def health():
    return {"status": "ok"}
