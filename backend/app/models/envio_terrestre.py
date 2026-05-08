from datetime import date
from decimal import Decimal
from sqlalchemy import String, Integer, Date, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import EstadoEnvio


class EnvioTerrestre(Base, TimestampMixin):
    __tablename__ = "envios_terrestres"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_guia: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)

    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    bodega_id: Mapped[int] = mapped_column(ForeignKey("bodegas.id"), nullable=False)

    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_registro: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_entrega: Mapped[date] = mapped_column(Date, nullable=False)

    precio_envio: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descuento_pct: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False, default=0)
    precio_final: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # regex ^[A-Z]{3}[0-9]{3}$ — validado en Pydantic, almacenado tal cual
    placa: Mapped[str] = mapped_column(String(6), nullable=False)

    estado: Mapped[EstadoEnvio] = mapped_column(
        SAEnum(EstadoEnvio, name="estadoenvio", native_enum=True),
        nullable=False,
        default=EstadoEnvio.PENDIENTE,
    )

    cliente = relationship("Cliente", lazy="select")
    producto = relationship("Producto", lazy="select")
    bodega = relationship("Bodega", lazy="select")
