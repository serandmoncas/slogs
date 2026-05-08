from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.enums import EstadoEnvio
from app.models.envio_terrestre import EnvioTerrestre


def list_all(
    db: Session,
    estado: EstadoEnvio | None,
    fecha_inicio: date | None,
    fecha_fin: date | None,
    cliente_id: int | None,
    page: int,
    size: int,
) -> tuple[list[EnvioTerrestre], int]:
    query = db.query(EnvioTerrestre).options(
        joinedload(EnvioTerrestre.cliente),
        joinedload(EnvioTerrestre.producto),
        joinedload(EnvioTerrestre.bodega),
    )
    if estado:
        query = query.filter(EnvioTerrestre.estado == estado)
    if fecha_inicio:
        query = query.filter(EnvioTerrestre.fecha_registro >= fecha_inicio)
    if fecha_fin:
        query = query.filter(EnvioTerrestre.fecha_registro <= fecha_fin)
    if cliente_id:
        query = query.filter(EnvioTerrestre.cliente_id == cliente_id)
    total = query.count()
    items = query.order_by(EnvioTerrestre.id.desc()).offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> EnvioTerrestre | None:
    return (
        db.query(EnvioTerrestre)
        .options(
            joinedload(EnvioTerrestre.cliente),
            joinedload(EnvioTerrestre.producto),
            joinedload(EnvioTerrestre.bodega),
        )
        .filter(EnvioTerrestre.id == id)
        .first()
    )


def get_by_numero_guia(db: Session, numero_guia: str) -> EnvioTerrestre | None:
    return db.query(EnvioTerrestre).filter(EnvioTerrestre.numero_guia == numero_guia).first()


def create(db: Session, data: dict) -> EnvioTerrestre:
    obj = EnvioTerrestre(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return get_by_id(db, obj.id)


def update(db: Session, obj: EnvioTerrestre, data: dict) -> EnvioTerrestre:
    for field, value in data.items():
        setattr(obj, field, value)
    db.commit()
    return get_by_id(db, obj.id)


def delete(db: Session, obj: EnvioTerrestre) -> None:
    db.delete(obj)
    db.commit()
