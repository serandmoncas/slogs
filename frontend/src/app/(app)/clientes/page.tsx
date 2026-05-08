'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useClientes, useDeleteCliente } from '@/hooks/useClientes'
import { useCurrentUser } from '@/contexts/UserContext'
import DataTable, { Column } from '@/components/DataTable'
import { colors, fonts, radius } from '@/lib/styles'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const { isAdmin } = useCurrentUser()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useClientes({ q: q || undefined, page, size: 20 })
  const deleteMut = useDeleteCliente()

  const columns: Column<Cliente>[] = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'nit',
      label: 'NIT',
      render: (r) => <span style={{ fontFamily: fonts.mono, fontSize: 12 }}>{r.nit}</span>,
    },
    { key: 'ciudad', label: 'Ciudad' },
    {
      key: 'email',
      label: 'Email',
      render: (r) => <span style={{ color: colors.textMuted }}>{r.email}</span>,
    },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'acciones',
      label: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/clientes/${r.id}`}
            style={{ fontSize: 11, color: colors.blue, textDecoration: 'none' }}
          >
            Editar
          </Link>
          {isAdmin && (
            <button
              onClick={() => {
                if (confirm(`¿Eliminar a ${r.nombre}?`)) deleteMut.mutate(r.id)
              }}
              style={{
                fontSize: 11,
                color: colors.red,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Clientes
        </h1>
        <Link
          href="/clientes/nuevo"
          style={{
            padding: '8px 18px',
            background: colors.amber,
            color: '#0B1220',
            borderRadius: radius.md,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          + Nuevo
        </Link>
      </div>
      <div
        style={{
          background: colors.panel,
          padding: 16,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nombre, NIT o ciudad…"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: colors.panelAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: colors.text,
            fontFamily: fonts.body,
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <DataTable<Cliente>
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin clientes registrados."
      />
      {data && data.total > 0 && (
        <div style={{ fontSize: 12, color: colors.textDim, fontFamily: fonts.body }}>
          {data.total} clientes
        </div>
      )}
    </div>
  )
}
