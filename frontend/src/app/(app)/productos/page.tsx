'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useProductos, useDeleteProducto } from '@/hooks/useProductos'
import DataTable, { Column } from '@/components/DataTable'
import { colors, fonts, radius } from '@/lib/styles'
import type { Producto } from '@/types'

export default function ProductosPage() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useProductos({ q: q || undefined })
  const deleteMut = useDeleteProducto()

  const columns: Column<Producto>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'descripcion', label: 'Descripción', render: (r) => <span style={{ color: colors.textMuted, fontSize: 12 }}>{r.descripcion ?? '—'}</span> },
    { key: 'acciones', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/productos/${r.id}`} style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}>Editar</Link>
        <button onClick={() => { if (confirm('¿Eliminar?')) deleteMut.mutate(r.id) }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Eliminar</button>
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Productos</h1>
        <Link href="/productos/nuevo" style={{ padding: '8px 18px', background: colors.amber, color: '#0B1220', borderRadius: radius.md, fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>+ Nuevo</Link>
      </div>
      <div style={{ background: colors.panel, padding: 16, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o categoría…"
          style={{ width: '100%', padding: '8px 12px', background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, fontFamily: fonts.body, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <DataTable<Producto> data={data?.items ?? []} columns={columns} loading={isLoading} keyExtractor={(r) => r.id} emptyMessage="Sin productos registrados." />
    </div>
  )
}
