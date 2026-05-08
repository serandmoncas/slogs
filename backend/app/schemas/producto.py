from datetime import datetime

from pydantic import BaseModel


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    categoria: str


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    categoria: str | None = None


class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    categoria: str
    created_at: datetime

    model_config = {"from_attributes": True}
