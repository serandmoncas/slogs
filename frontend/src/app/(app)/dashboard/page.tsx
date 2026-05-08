'use client'
import { useDashboard } from '@/hooks/useDashboard'
import { useEnviosTerrestres } from '@/hooks/useEnviosTerrestres'
import KpiCard from '@/components/KpiCard'
import ColombiaMap from '@/components/ColombiaMap'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { colors, fonts, radius } from '@/lib/styles'
import { formatCOP, formatDate } from '@/lib/format'
import type { EstadoEnvio } from '@/types'

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useDashboard()
  const { data: recientes } = useEnviosTerrestres({ size: 8 })

  const rutas = (recientes?.items ?? []).map((e) => ({
    origen: e.bodega.ciudad,
    destino: e.cliente.ciudad,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Total envíos"
          icon="📦"
          value={loadingStats ? '…' : (stats?.total_envios ?? 0)}
          accent={colors.blue}
        />
        <KpiCard
          label="Terrestres"
          icon="🚛"
          value={loadingStats ? '…' : (stats?.terrestres ?? 0)}
          accent={colors.amber}
        />
        <KpiCard
          label="Marítimos"
          icon="🚢"
          value={loadingStats ? '…' : (stats?.maritimos ?? 0)}
          accent={colors.blue}
        />
        <KpiCard
          label="Ingresos del mes"
          icon="💰"
          value={loadingStats ? '…' : formatCOP(stats?.ingresos_mes ?? 0)}
          accent={colors.green}
        />
      </div>

      {/* Mapa + actividad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Colombia Map */}
        <div
          style={{
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 600,
              color: colors.textMuted,
              letterSpacing: '0.06em',
              marginBottom: 12,
            }}
          >
            RUTAS ACTIVAS
          </div>
          <ColombiaMap rutas={rutas} />
        </div>

        {/* Actividad reciente */}
        <div
          style={{
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 600,
              color: colors.textMuted,
              letterSpacing: '0.06em',
              marginBottom: 16,
            }}
          >
            ACTIVIDAD RECIENTE
          </div>

          {!recientes ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <LoadingSpinner />
            </div>
          ) : recientes.items.length === 0 ? (
            <p style={{ color: colors.textDim, fontSize: 13, fontFamily: fonts.body }}>
              Sin envíos recientes.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recientes.items.map((envio) => (
                <div
                  key={envio.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: colors.panelAlt,
                    borderRadius: radius.md,
                    borderLeft: `2px solid ${colors.amber}`,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.amber }}>
                      {envio.numero_guia}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {envio.cliente.nombre} · {formatDate(envio.fecha_entrega)}
                    </div>
                  </div>
                  <StatusBadge estado={envio.estado as EstadoEnvio} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Por estado */}
      {stats && (
        <div
          style={{
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 600,
              color: colors.textMuted,
              letterSpacing: '0.06em',
              marginBottom: 16,
            }}
          >
            DISTRIBUCIÓN POR ESTADO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Pendiente', value: stats.por_estado.PENDIENTE, color: colors.amber },
              { label: 'En Tránsito', value: stats.por_estado.EN_TRANSITO, color: colors.blue },
              { label: 'Entregado', value: stats.por_estado.ENTREGADO, color: colors.green },
              { label: 'Cancelado', value: stats.por_estado.CANCELADO, color: colors.red },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  textAlign: 'center',
                  padding: '16px 8px',
                  background: `${color}10`,
                  borderRadius: radius.md,
                  border: `1px solid ${color}30`,
                }}
              >
                <div style={{ fontSize: 28, fontFamily: fonts.display, fontWeight: 700, color }}>
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontFamily: fonts.body,
                    marginTop: 4,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
