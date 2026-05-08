import { colors, fonts, radius } from '@/lib/styles'

interface Props {
  label: string
  value: string | number
  delta?: number
  icon: string
  accent?: string
}

export default function KpiCard({ label, value, delta, icon, accent = colors.amber }: Props) {
  const isPositive = delta !== undefined && delta >= 0
  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accent}40, ${accent})`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: 12,
            color: colors.textMuted,
            fontFamily: fonts.body,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div
        style={{
          fontSize: 32,
          fontFamily: fonts.display,
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {delta !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontFamily: fonts.mono,
          }}
        >
          <span style={{ color: isPositive ? colors.green : colors.red }}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          <span style={{ color: colors.textDim }}>vs ayer</span>
        </div>
      )}
    </div>
  )
}
