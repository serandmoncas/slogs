import re
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator, Field
from app.models.enums import EstadoEnvio
from app.schemas.cliente import ClienteResponse
from app.schemas.producto import ProductoResponse
from app.schemas.bodega import BodegaResponse


class EnvioTerrestreCreate(BaseModel):
    numero_guia: str = Field(max_length=10)
    cliente_id: int
    producto_id: int
    bodega_id: int
    cantidad: int = Field(gt=0)
    fecha_entrega: date
    precio_envio: Decimal = Field(gt=0, decimal_places=2)
    placa: str

    @field_validator("placa")
    @classmethod
    def validate_placa(cls, v: str) -> str:
        if not re.match(r"^[A-Z]{3}[0-9]{3}$", v):
            raise ValueError("Placa inválida. Formato requerido: ABC123 (3 letras mayúsculas + 3 dígitos).")
        return v


class EnvioTerrestreUpdate(BaseModel):
    numero_guia: str | None = Field(None, max_length=10)
    cliente_id: int | None = None
    producto_id: int | None = None
    bodega_id: int | None = None
    cantidad: int | None = Field(None, gt=0)
    fecha_entrega: date | None = None
    precio_envio: Decimal | None = Field(None, gt=0, decimal_places=2)
    placa: str | None = None
    estado: EstadoEnvio | None = None

    @field_validator("placa")
    @classmethod
    def validate_placa(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^[A-Z]{3}[0-9]{3}$", v):
            raise ValueError("Placa inválida. Formato requerido: ABC123 (3 letras mayúsculas + 3 dígitos).")
        return v


class EnvioTerrestreResponse(BaseModel):
    id: int
    numero_guia: str
    cantidad: int
    fecha_registro: date
    fecha_entrega: date
    precio_envio: Decimal
    descuento_pct: Decimal
    precio_final: Decimal
    placa: str
    estado: EstadoEnvio
    created_at: datetime
    updated_at: datetime
    cliente: ClienteResponse
    producto: ProductoResponse
    bodega: BodegaResponse

    model_config = {"from_attributes": True}
