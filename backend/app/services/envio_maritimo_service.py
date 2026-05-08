from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import EstadoEnvio
from app.models.envio_maritimo import EnvioMaritimo
from app.repositories import envio_maritimo_repo
from app.schemas.common import PaginatedResponse
from app.schemas.envio_maritimo import (
    EnvioMaritimoCreate,
    EnvioMaritimoResponse,
    EnvioMaritimoUpdate,
)


def calcular_descuento_maritimo(cantidad: int) -> Decimal:
    return Decimal("3.00") if cantidad > 10 else Decimal("0.00")


def calcular_precio_final(precio_envio: Decimal, descuento_pct: Decimal) -> Decimal:
    return (precio_envio * (1 - descuento_pct / 100)).quantize(Decimal("0.01"))


def list_envios(
    db: Session,
    estado: EstadoEnvio | None,
    fecha_inicio: date | None,
    fecha_fin: date | None,
    cliente_id: int | None,
    page: int,
    size: int,
) -> PaginatedResponse[EnvioMaritimoResponse]:
    items, total = envio_maritimo_repo.list_all(
        db, estado, fecha_inicio, fecha_fin, cliente_id, page, size
    )
    return PaginatedResponse(items=items, total=total, page=page, size=size)


def get_envio(db: Session, id: int) -> EnvioMaritimo:
    obj = envio_maritimo_repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Envío marítimo no encontrado."
        )
    return obj


def create_envio(db: Session, data: EnvioMaritimoCreate) -> EnvioMaritimo:
    if envio_maritimo_repo.get_by_numero_guia(db, data.numero_guia):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un envío con ese número de guía.",
        )

    descuento_pct = calcular_descuento_maritimo(data.cantidad)
    precio_final = calcular_precio_final(data.precio_envio, descuento_pct)

    payload = data.model_dump()
    payload["fecha_registro"] = date.today()
    payload["descuento_pct"] = descuento_pct
    payload["precio_final"] = precio_final
    payload["estado"] = EstadoEnvio.PENDIENTE

    return envio_maritimo_repo.create(db, payload)


def update_envio(db: Session, id: int, data: EnvioMaritimoUpdate) -> EnvioMaritimo:
    obj = get_envio(db, id)

    if data.numero_guia and data.numero_guia != obj.numero_guia:
        if envio_maritimo_repo.get_by_numero_guia(db, data.numero_guia):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un envío con ese número de guía.",
            )

    changes = data.model_dump(exclude_unset=True)

    if "cantidad" in changes or "precio_envio" in changes:
        cantidad = changes.get("cantidad", obj.cantidad)
        precio_envio = changes.get("precio_envio", obj.precio_envio)
        changes["descuento_pct"] = calcular_descuento_maritimo(cantidad)
        changes["precio_final"] = calcular_precio_final(precio_envio, changes["descuento_pct"])

    return envio_maritimo_repo.update(db, obj, changes)


def delete_envio(db: Session, id: int) -> None:
    obj = get_envio(db, id)
    envio_maritimo_repo.delete(db, obj)
