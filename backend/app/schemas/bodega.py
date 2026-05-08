from datetime import datetime
from pydantic import BaseModel
from app.models.enums import TipoBodega


class BodegaCreate(BaseModel):
    nombre: str
    ciudad: str
    direccion: str
    capacidad: int
    tipo: TipoBodega


class BodegaUpdate(BaseModel):
    nombre: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    capacidad: int | None = None
    tipo: TipoBodega | None = None


class BodegaResponse(BaseModel):
    id: int
    nombre: str
    ciudad: str
    direccion: str
    capacidad: int
    tipo: TipoBodega
    created_at: datetime

    model_config = {"from_attributes": True}
