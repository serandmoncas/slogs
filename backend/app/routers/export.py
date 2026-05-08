import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.enums import EstadoEnvio
from app.repositories import envio_terrestre_repo, envio_maritimo_repo

router = APIRouter(prefix="/envios", tags=["Export"], dependencies=[Depends(get_current_user)])


def _csv_response(rows: list[list], headers: list[str], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    buf.write('﻿')  # BOM para compatibilidad con Excel en español
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/terrestres/export")
def export_terrestres(
    estado: EstadoEnvio | None = Query(None),
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    cliente_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    items, _ = envio_terrestre_repo.list_all(db, estado, fecha_inicio, fecha_fin, cliente_id, page=1, size=10_000)
    filename = f"terrestres_{date.today()}.csv"
    headers = ["numero_guia", "cliente", "nit", "producto", "bodega", "ciudad_bodega",
               "cantidad", "fecha_registro", "fecha_entrega",
               "precio_envio", "descuento_pct", "precio_final", "placa", "estado"]
    rows = [
        [e.numero_guia, e.cliente.nombre, e.cliente.nit, e.producto.nombre,
         e.bodega.nombre, e.bodega.ciudad, e.cantidad, e.fecha_registro,
         e.fecha_entrega, e.precio_envio, e.descuento_pct, e.precio_final,
         e.placa, e.estado.value]
        for e in items
    ]
    return _csv_response(rows, headers, filename)


@router.get("/maritimos/export")
def export_maritimos(
    estado: EstadoEnvio | None = Query(None),
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    cliente_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    items, _ = envio_maritimo_repo.list_all(db, estado, fecha_inicio, fecha_fin, cliente_id, page=1, size=10_000)
    filename = f"maritimos_{date.today()}.csv"
    headers = ["numero_guia", "cliente", "nit", "producto", "puerto", "pais",
               "cantidad", "fecha_registro", "fecha_entrega",
               "precio_envio", "descuento_pct", "precio_final", "numero_flota", "estado"]
    rows = [
        [e.numero_guia, e.cliente.nombre, e.cliente.nit, e.producto.nombre,
         e.puerto.nombre, e.puerto.pais, e.cantidad, e.fecha_registro,
         e.fecha_entrega, e.precio_envio, e.descuento_pct, e.precio_final,
         e.numero_flota, e.estado.value]
        for e in items
    ]
    return _csv_response(rows, headers, filename)
