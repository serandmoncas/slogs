'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useEnviosMaritimos, useDeleteEnvioMaritimo } from '@/hooks/useEnviosMaritimos'
import DataTable, { Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import DiscountBadge from '@/components/DiscountBadge'
import { useToast } from '@/components/Toast'
import { getToken } from '@/lib/auth'
import { colors, fonts, radius } from '@/lib/styles'
import { formatCOP, formatDate } from '@/lib/format'
import type { EnvioMaritimo, EstadoEnvio } from '@/types'

const ESTADOS = ['', 'PENDIENTE', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO']
const API = process.env.NEXT_PUBLIC_API_URL ?? '/proxy/api/v1'

export default function MaritimosPage() {
  const { toast } = useToast()
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useEnviosMaritimos({ estado: estado || undefined, page, size: 15 })
  const deleteMut = useDeleteEnvioMaritimo()

  const handleExport = () => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    const token = getToken()
    fetch(`${API}/envios/maritimos/export?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.blob()).then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `maritimos_${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    }).catch(() => toast('Error al exportar', 'error'))
  }

  const columns: Column<EnvioMaritimo>[] = [
    { key: 'numero_guia', label: 'Guía', render: (r) => <span style={{ fontFamily: fonts.mono, color: colors.blue, fontSize: 12 }}>{r.numero_guia}</span> },
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente.nombre },
    { key: 'producto', label: 'Producto', render: (r) => r.producto.nombre },
    { key: 'puerto', label: 'Puerto', render: (r) => r.puerto.nombre },
    { key: 'numero_flota', label: 'Flota', render: (r) => <span style={{ fontFamily: fonts.mono, fontSize: 11 }}>{r.numero_flota}</span> },
    { key: 'cantidad', label: 'Uds.' },
    { key: 'estado', label: 'Estado', render: (r) => <StatusBadge estado={r.estado as EstadoEnvio} /> },
    { key: 'descuento_pct', label: 'Desc.', render: (r) => <DiscountBadge pct={r.descuento_pct} /> },
    { key: 'precio_final', label: 'Total', render: (r) => <span style={{ fontFamily: fonts.mono, fontWeight: 600 }}>{formatCOP(r.precio_final)}</span> },
    { key: 'fecha_entrega', label: 'Entrega', render: (r) => formatDate(r.fecha_entrega) },
    { key: 'acciones', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/maritimos/${r.id}`} style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}>Editar</Link>
        <button onClick={() => { if (confirm('¿Eliminar?')) deleteMut.mutate(r.id) }}
          style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Eliminar
        </button>
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Envíos Marítimos</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{ padding: '8px 16px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, cursor: 'pointer' }}>
            ↓ CSV
          </button>
          <Link href="/maritimos/nuevo" style={{ padding: '8px 18px', background: colors.blue, color: '#0B1220', borderRadius: radius.md, fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            + Nuevo Envío
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, background: colors.panel, padding: 16, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}
          style={{ padding: '7px 12px', background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: estado ? colors.text : colors.textDim, fontFamily: fonts.body, fontSize: 13 }}>
          {ESTADOS.map((e) => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
        </select>
      </div>
      <DataTable<EnvioMaritimo> data={data?.items ?? []} columns={columns} loading={isLoading} keyExtractor={(r) => r.id} emptyMessage="Sin envíos marítimos registrados." />
      {data && data.total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '5px 12px', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Anterior</button>
          <button disabled={page * 15 >= data.total} onClick={() => setPage((p) => p + 1)} style={{ padding: '5px 12px', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, cursor: page * 15 >= data.total ? 'not-allowed' : 'pointer', opacity: page * 15 >= data.total ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}
