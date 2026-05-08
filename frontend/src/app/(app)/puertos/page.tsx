'use client'
import Link from 'next/link'
import { usePuertos, useDeletePuerto } from '@/hooks/usePuertos'
import DataTable, { Column } from '@/components/DataTable'
import { colors, fonts, radius } from '@/lib/styles'
import type { Puerto } from '@/types'

export default function PuertosPage() {
  const { data, isLoading } = usePuertos()
  const deleteMut = useDeletePuerto()

  const columns: Column<Puerto>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'codigo', label: 'Código', render: (r) => <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.blue }}>{r.codigo}</span> },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'pais', label: 'País' },
    { key: 'tipo', label: 'Tipo', render: (r) => (
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: r.tipo === 'INTERNACIONAL' ? `${colors.blue}20` : `${colors.green}20`, color: r.tipo === 'INTERNACIONAL' ? colors.blue : colors.green }}>
        {r.tipo}
      </span>
    )},
    { key: 'acciones', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/puertos/${r.id}`} style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}>Editar</Link>
        <button onClick={() => { if (confirm('¿Eliminar?')) deleteMut.mutate(r.id) }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Eliminar</button>
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Puertos</h1>
        <Link href="/puertos/nuevo" style={{ padding: '8px 18px', background: colors.amber, color: '#0B1220', borderRadius: radius.md, fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>+ Nuevo</Link>
      </div>
      <DataTable<Puerto> data={data?.items ?? []} columns={columns} loading={isLoading} keyExtractor={(r) => r.id} emptyMessage="Sin puertos registrados." />
    </div>
  )
}
