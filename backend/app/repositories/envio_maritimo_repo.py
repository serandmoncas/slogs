from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.enums import EstadoEnvio
from app.models.envio_maritimo import EnvioMaritimo


def list_all(
    db: Session,
    estado: EstadoEnvio | None,
    fecha_inicio: date | None,
    fecha_fin: date | None,
    cliente_id: int | None,
    page: int,
    size: int,
) -> tuple[list[EnvioMaritimo], int]:
    query = db.query(EnvioMaritimo).options(
        joinedload(EnvioMaritimo.cliente),
        joinedload(EnvioMaritimo.producto),
        joinedload(EnvioMaritimo.puerto),
    )
    if estado:
        query = query.filter(EnvioMaritimo.estado == estado)
    if fecha_inicio:
        query = query.filter(EnvioMaritimo.fecha_registro >= fecha_inicio)
    if fecha_fin:
        query = query.filter(EnvioMaritimo.fecha_registro <= fecha_fin)
    if cliente_id:
        query = query.filter(EnvioMaritimo.cliente_id == cliente_id)
    total = query.count()
    items = query.order_by(EnvioMaritimo.id.desc()).offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> EnvioMaritimo | None:
    return (
        db.query(EnvioMaritimo)
        .options(
            joinedload(EnvioMaritimo.cliente),
            joinedload(EnvioMaritimo.producto),
            joinedload(EnvioMaritimo.puerto),
        )
        .filter(EnvioMaritimo.id == id)
        .first()
    )


def get_by_numero_guia(db: Session, numero_guia: str) -> EnvioMaritimo | None:
    return db.query(EnvioMaritimo).filter(EnvioMaritimo.numero_guia == numero_guia).first()


def create(db: Session, data: dict) -> EnvioMaritimo:
    obj = EnvioMaritimo(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return get_by_id(db, obj.id)


def update(db: Session, obj: EnvioMaritimo, data: dict) -> EnvioMaritimo:
    for field, value in data.items():
        setattr(obj, field, value)
    db.commit()
    return get_by_id(db, obj.id)


def delete(db: Session, obj: EnvioMaritimo) -> None:
    db.delete(obj)
    db.commit()
