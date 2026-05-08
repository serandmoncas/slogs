from datetime import date
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.envio_terrestre import EnvioTerrestre
from app.models.envio_maritimo import EnvioMaritimo
from app.models.enums import EstadoEnvio
from app.schemas.dashboard import DashboardStats, EstadoStats


def get_stats(db: Session) -> DashboardStats:
    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)

    terrestres = db.query(func.count(EnvioTerrestre.id)).scalar() or 0
    maritimos = db.query(func.count(EnvioMaritimo.id)).scalar() or 0

    entregados_hoy = (
        db.query(func.count(EnvioTerrestre.id))
        .filter(EnvioTerrestre.estado == EstadoEnvio.ENTREGADO, EnvioTerrestre.fecha_entrega == hoy)
        .scalar() or 0
    ) + (
        db.query(func.count(EnvioMaritimo.id))
        .filter(EnvioMaritimo.estado == EstadoEnvio.ENTREGADO, EnvioMaritimo.fecha_entrega == hoy)
        .scalar() or 0
    )

    ingresos_t = db.query(func.coalesce(func.sum(EnvioTerrestre.precio_final), 0)).filter(
        EnvioTerrestre.fecha_registro >= primer_dia_mes
    ).scalar() or Decimal("0")

    ingresos_m = db.query(func.coalesce(func.sum(EnvioMaritimo.precio_final), 0)).filter(
        EnvioMaritimo.fecha_registro >= primer_dia_mes
    ).scalar() or Decimal("0")

    # conteo por estado (terrestre + marítimo combinado)
    def _count_estado(modelo, estado):
        return db.query(func.count(modelo.id)).filter(modelo.estado == estado).scalar() or 0

    por_estado = EstadoStats(
        PENDIENTE=_count_estado(EnvioTerrestre, EstadoEnvio.PENDIENTE) + _count_estado(EnvioMaritimo, EstadoEnvio.PENDIENTE),
        EN_TRANSITO=_count_estado(EnvioTerrestre, EstadoEnvio.EN_TRANSITO) + _count_estado(EnvioMaritimo, EstadoEnvio.EN_TRANSITO),
        ENTREGADO=_count_estado(EnvioTerrestre, EstadoEnvio.ENTREGADO) + _count_estado(EnvioMaritimo, EstadoEnvio.ENTREGADO),
        CANCELADO=_count_estado(EnvioTerrestre, EstadoEnvio.CANCELADO) + _count_estado(EnvioMaritimo, EstadoEnvio.CANCELADO),
    )

    return DashboardStats(
        total_envios=terrestres + maritimos,
        terrestres=terrestres,
        maritimos=maritimos,
        entregados_hoy=entregados_hoy,
        ingresos_mes=Decimal(str(ingresos_t)) + Decimal(str(ingresos_m)),
        por_estado=por_estado,
    )
