from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.enums import EstadoEnvio
from app.schemas.common import PaginatedResponse
from app.schemas.envio_maritimo import (
    EnvioMaritimoCreate,
    EnvioMaritimoResponse,
    EnvioMaritimoUpdate,
)
from app.schemas.envio_terrestre import (
    EnvioTerrestreCreate,
    EnvioTerrestreResponse,
    EnvioTerrestreUpdate,
)
from app.services import envio_maritimo_service, envio_terrestre_service

router = APIRouter(prefix="/envios", tags=["Envíos"], dependencies=[Depends(get_current_user)])

# ── Terrestres ──────────────────────────────────────────────────────────────


@router.get("/terrestres", response_model=PaginatedResponse[EnvioTerrestreResponse])
def list_terrestres(
    estado: EstadoEnvio | None = Query(None),
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    cliente_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return envio_terrestre_service.list_envios(
        db, estado, fecha_inicio, fecha_fin, cliente_id, page, size
    )


@router.post(
    "/terrestres", response_model=EnvioTerrestreResponse, status_code=status.HTTP_201_CREATED
)
def create_terrestre(data: EnvioTerrestreCreate, db: Session = Depends(get_db)):
    return envio_terrestre_service.create_envio(db, data)


@router.get("/terrestres/{id}", response_model=EnvioTerrestreResponse)
def get_terrestre(id: int, db: Session = Depends(get_db)):
    return envio_terrestre_service.get_envio(db, id)


@router.put("/terrestres/{id}", response_model=EnvioTerrestreResponse)
def update_terrestre(id: int, data: EnvioTerrestreUpdate, db: Session = Depends(get_db)):
    return envio_terrestre_service.update_envio(db, id, data)


@router.delete("/terrestres/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_terrestre(id: int, db: Session = Depends(get_db)):
    envio_terrestre_service.delete_envio(db, id)


# ── Marítimos ────────────────────────────────────────────────────────────────


@router.get("/maritimos", response_model=PaginatedResponse[EnvioMaritimoResponse])
def list_maritimos(
    estado: EstadoEnvio | None = Query(None),
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    cliente_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return envio_maritimo_service.list_envios(
        db, estado, fecha_inicio, fecha_fin, cliente_id, page, size
    )


@router.post(
    "/maritimos", response_model=EnvioMaritimoResponse, status_code=status.HTTP_201_CREATED
)
def create_maritimo(data: EnvioMaritimoCreate, db: Session = Depends(get_db)):
    return envio_maritimo_service.create_envio(db, data)


@router.get("/maritimos/{id}", response_model=EnvioMaritimoResponse)
def get_maritimo(id: int, db: Session = Depends(get_db)):
    return envio_maritimo_service.get_envio(db, id)


@router.put("/maritimos/{id}", response_model=EnvioMaritimoResponse)
def update_maritimo(id: int, data: EnvioMaritimoUpdate, db: Session = Depends(get_db)):
    return envio_maritimo_service.update_envio(db, id, data)


@router.delete("/maritimos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maritimo(id: int, db: Session = Depends(get_db)):
    envio_maritimo_service.delete_envio(db, id)
