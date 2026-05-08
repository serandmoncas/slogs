from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClienteCreate(BaseModel):
    nombre: str
    nit: str
    email: EmailStr
    telefono: str
    direccion: str
    ciudad: str


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    nit: str | None = None
    email: EmailStr | None = None
    telefono: str | None = None
    direccion: str | None = None
    ciudad: str | None = None


class ClienteResponse(BaseModel):
    id: int
    nombre: str
    nit: str
    email: str
    telefono: str
    direccion: str
    ciudad: str
    created_at: datetime

    model_config = {"from_attributes": True}
