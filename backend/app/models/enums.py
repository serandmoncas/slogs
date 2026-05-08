import enum


class TipoBodega(str, enum.Enum):
    NACIONAL = "NACIONAL"
    INTERNACIONAL = "INTERNACIONAL"


class TipoPuerto(str, enum.Enum):
    NACIONAL = "NACIONAL"
    INTERNACIONAL = "INTERNACIONAL"


class EstadoEnvio(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    EN_TRANSITO = "EN_TRÁNSITO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"
