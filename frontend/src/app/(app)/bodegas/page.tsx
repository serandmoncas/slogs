'use client'
import Link from 'next/link'
import { useBodegas, useDeleteBodega } from '@/hooks/useBodegas'
import { useCurrentUser } from '@/contexts/UserContext'
import DataTable, { Column } from '@/components/DataTable'
import { colors, fonts, radius } from '@/lib/styles'
import type { Bodega } from '@/types'

export default function BodegasPage() {
  const { isAdmin } = useCurrentUser()
  const { data, isLoading } = useBodegas()
  const deleteMut = useDeleteBodega()

  const columns: Column<Bodega>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'tipo', label: 'Tipo', render: (r) => (
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: r.tipo === 'INTERNACIONAL' ? `${colors.blue}20` : `${colors.amber}20`, color: r.tipo === 'INTERNACIONAL' ? colors.blue : colors.amber }}>
        {r.tipo}
      </span>
    )},
    { key: 'capacidad', label: 'Capacidad', render: (r) => `${r.capacidad.toLocaleString()} u.` },
    { key: 'acciones', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/bodegas/${r.id}`} style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}>Editar</Link>
        {isAdmin && (<button onClick={() => { if (confirm('¿Eliminar?')) deleteMut.mutate(r.id) }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Eliminar</button>)}
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Bodegas</h1>
        <Link href="/bodegas/nuevo" style={{ padding: '8px 18px', background: colors.amber, color: '#0B1220', borderRadius: radius.md, fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>+ Nueva</Link>
      </div>
      <DataTable<Bodega> data={data?.items ?? []} columns={columns} loading={isLoading} keyExtractor={(r) => r.id} emptyMessage="Sin bodegas registradas." />
    </div>
  )
}
