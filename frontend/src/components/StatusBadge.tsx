import { colors, fonts, radius } from '@/lib/styles'
import type { EstadoEnvio } from '@/types'

const config: Record<EstadoEnvio, { label: string; color: string; bg: string }> = {
  PENDIENTE:    { label: 'Pendiente',    color: colors.amber, bg: colors.amberDim },
  'EN_TRÁNSITO':{ label: 'En Tránsito', color: colors.blue,  bg: colors.blueDim  },
  ENTREGADO:   { label: 'Entregado',    color: colors.green, bg: colors.greenDim },
  CANCELADO:   { label: 'Cancelado',    color: colors.red,   bg: colors.redDim   },
}

export default function StatusBadge({ estado }: { estado: EstadoEnvio }) {
  const { label, color, bg } = config[estado] ?? config.PENDIENTE
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 10px',
      borderRadius: radius.full,
      background: bg,
      color,
      fontSize: 11,
      fontFamily: fonts.mono,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}
