'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useEnviosTerrestres, useDeleteEnvioTerrestre } from '@/hooks/useEnviosTerrestres'
import DataTable, { Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import DiscountBadge from '@/components/DiscountBadge'
import { useToast } from '@/components/Toast'
import { getToken } from '@/lib/auth'
import { colors, fonts, radius } from '@/lib/styles'
import { formatCOP, formatDate } from '@/lib/format'
import type { EnvioTerrestre, EstadoEnvio } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/proxy/api/v1'

const ESTADOS = ['', 'PENDIENTE', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO']

export default function TerrestresPage() {
  const { toast } = useToast()
  const [estado, setEstado] = useState('')

  const handleExport = () => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (fechaInicio) params.set('fecha_inicio', fechaInicio)
    if (fechaFin) params.set('fecha_fin', fechaFin)
    const token = getToken()
    fetch(`${API}/envios/terrestres/export?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.blob()).then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `terrestres_${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    }).catch(() => toast('Error al exportar', 'error'))
  }
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useEnviosTerrestres({
    estado: estado || undefined,
    fecha_inicio: fechaInicio || undefined,
    fecha_fin: fechaFin || undefined,
    page, size: 15,
  })
  const deleteMut = useDeleteEnvioTerrestre()

  const columns: Column<EnvioTerrestre>[] = [
    { key: 'numero_guia', label: 'Guía', render: (r) => (
      <span style={{ fontFamily: fonts.mono, color: colors.amber, fontSize: 12 }}>{r.numero_guia}</span>
    )},
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente.nombre },
    { key: 'producto', label: 'Producto', render: (r) => r.producto.nombre },
    { key: 'bodega', label: 'Bodega', render: (r) => r.bodega.nombre },
    { key: 'cantidad', label: 'Uds.' },
    { key: 'estado', label: 'Estado', render: (r) => <StatusBadge estado={r.estado as EstadoEnvio} /> },
    { key: 'descuento_pct', label: 'Desc.', render: (r) => <DiscountBadge pct={r.descuento_pct} /> },
    { key: 'precio_final', label: 'Total', render: (r) => (
      <span style={{ fontFamily: fonts.mono, fontWeight: 600 }}>{formatCOP(r.precio_final)}</span>
    )},
    { key: 'fecha_entrega', label: 'Entrega', render: (r) => formatDate(r.fecha_entrega) },
    { key: 'acciones', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/terrestres/${r.id}`} style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}>Editar</Link>
        <button onClick={() => { if (confirm('¿Eliminar este envío?')) deleteMut.mutate(r.id, { onSuccess: () => toast('Envío eliminado.', 'success'), onError: () => toast('Error al eliminar.', 'error') }) }}
          style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Eliminar
        </button>
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
          Envíos Terrestres
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{
            padding: '8px 16px', background: 'none',
            border: `1px solid ${colors.border}`, borderRadius: radius.md,
            color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, cursor: 'pointer',
          }}>
            ↓ CSV
          </button>
          <Link href="/terrestres/nuevo" style={{
            padding: '8px 18px', background: colors.amber, color: '#0B1220',
            borderRadius: radius.md, fontFamily: fonts.display, fontWeight: 700,
            fontSize: 14, textDecoration: 'none', letterSpacing: '0.03em',
          }}>
            + Nuevo Envío
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        background: colors.panel, padding: 16, borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
      }}>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}
          style={{ padding: '7px 12px', background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: estado ? colors.text : colors.textDim, fontFamily: fonts.body, fontSize: 13 }}>
          {ESTADOS.map((e) => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
        </select>
        <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1) }}
          style={{ padding: '7px 12px', background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, fontFamily: fonts.body, fontSize: 13 }} />
        <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPage(1) }}
          style={{ padding: '7px 12px', background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, fontFamily: fonts.body, fontSize: 13 }} />
        {(estado || fechaInicio || fechaFin) && (
          <button onClick={() => { setEstado(''); setFechaInicio(''); setFechaFin(''); setPage(1) }}
            style={{ padding: '7px 12px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      <DataTable<EnvioTerrestre>
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin envíos terrestres registrados."
      />

      {/* Paginación */}
      {data && data.total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>
          <span>{data.total} resultados</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              style={{ padding: '5px 12px', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              ← Anterior
            </button>
            <span style={{ padding: '5px 12px' }}>Pág. {page}</span>
            <button disabled={page * 15 >= data.total} onClick={() => setPage((p) => p + 1)}
              style={{ padding: '5px 12px', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, cursor: page * 15 >= data.total ? 'not-allowed' : 'pointer', opacity: page * 15 >= data.total ? 0.4 : 1 }}>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
