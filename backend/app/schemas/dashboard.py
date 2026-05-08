from decimal import Decimal

from pydantic import BaseModel


class EstadoStats(BaseModel):
    PENDIENTE: int = 0
    EN_TRANSITO: int = 0
    ENTREGADO: int = 0
    CANCELADO: int = 0


class DashboardStats(BaseModel):
    total_envios: int
    terrestres: int
    maritimos: int
    entregados_hoy: int
    ingresos_mes: Decimal
    por_estado: EstadoStats
