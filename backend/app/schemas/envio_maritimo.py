import re
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator, Field
from app.models.enums import EstadoEnvio
from app.schemas.cliente import ClienteResponse
from app.schemas.producto import ProductoResponse
from app.schemas.puerto import PuertoResponse


class EnvioMaritimoCreate(BaseModel):
    numero_guia: str = Field(max_length=10)
    cliente_id: int
    producto_id: int
    puerto_id: int
    cantidad: int = Field(gt=0)
    fecha_entrega: date
    precio_envio: Decimal = Field(gt=0, decimal_places=2)
    numero_flota: str

    @field_validator("numero_flota")
    @classmethod
    def validate_numero_flota(cls, v: str) -> str:
        if not re.match(r"^[A-Z]{3}[0-9]{4}[A-Z]$", v):
            raise ValueError("Número de flota inválido. Formato requerido: ABC1234D (3 letras + 4 dígitos + 1 letra).")
        return v


class EnvioMaritimoUpdate(BaseModel):
    numero_guia: str | None = Field(None, max_length=10)
    cliente_id: int | None = None
    producto_id: int | None = None
    puerto_id: int | None = None
    cantidad: int | None = Field(None, gt=0)
    fecha_entrega: date | None = None
    precio_envio: Decimal | None = Field(None, gt=0, decimal_places=2)
    numero_flota: str | None = None
    estado: EstadoEnvio | None = None

    @field_validator("numero_flota")
    @classmethod
    def validate_numero_flota(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^[A-Z]{3}[0-9]{4}[A-Z]$", v):
            raise ValueError("Número de flota inválido. Formato requerido: ABC1234D (3 letras + 4 dígitos + 1 letra).")
        return v


class EnvioMaritimoResponse(BaseModel):
    id: int
    numero_guia: str
    cantidad: int
    fecha_registro: date
    fecha_entrega: date
    precio_envio: Decimal
    descuento_pct: Decimal
    precio_final: Decimal
    numero_flota: str
    estado: EstadoEnvio
    created_at: datetime
    updated_at: datetime
    cliente: ClienteResponse
    producto: ProductoResponse
    puerto: PuertoResponse

    model_config = {"from_attributes": True}
