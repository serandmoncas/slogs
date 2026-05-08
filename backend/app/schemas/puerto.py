from datetime import datetime

from pydantic import BaseModel

from app.models.enums import TipoPuerto


class PuertoCreate(BaseModel):
    nombre: str
    ciudad: str
    pais: str
    codigo: str
    tipo: TipoPuerto


class PuertoUpdate(BaseModel):
    nombre: str | None = None
    ciudad: str | None = None
    pais: str | None = None
    codigo: str | None = None
    tipo: TipoPuerto | None = None


class PuertoResponse(BaseModel):
    id: int
    nombre: str
    ciudad: str
    pais: str
    codigo: str
    tipo: TipoPuerto
    created_at: datetime

    model_config = {"from_attributes": True}
