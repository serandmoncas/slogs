'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreatePuerto } from '@/hooks/usePuertos'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import { colors, fonts, radius } from '@/lib/styles'

export default function NuevoPuertoPage() {
  const router = useRouter()
  const createMut = useCreatePuerto()
  const [form, setForm] = useState({
    nombre: '',
    ciudad: '',
    pais: 'Colombia',
    codigo: '',
    tipo: 'NACIONAL',
  })
  const [apiError, setApiError] = useState('')

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    try {
      await createMut.mutateAsync(form)
      router.push('/puertos')
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error.'
      )
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link
          href="/puertos"
          style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}
        >
          ← Puertos
        </Link>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Nuevo Puerto
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <FormInput label="Nombre" value={form.nombre} onChange={set('nombre')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
          <FormInput label="País" value={form.pais} onChange={set('pais')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            label="Código (único)"
            value={form.codigo}
            onChange={set('codigo')}
            hint="Ej: CTG, BUN, MIA"
          />
          <FormSelect
            label="Tipo"
            value={form.tipo}
            onChange={set('tipo')}
            options={[
              { value: 'NACIONAL', label: 'Nacional' },
              { value: 'INTERNACIONAL', label: 'Internacional' },
            ]}
          />
        </div>
        {apiError && (
          <div
            style={{
              padding: '10px 14px',
              background: `${colors.red}15`,
              border: `1px solid ${colors.red}40`,
              borderRadius: radius.md,
              color: colors.red,
              fontSize: 13,
            }}
          >
            {apiError}
          </div>
        )}
        <button
          type="submit"
          disabled={createMut.isPending}
          style={{
            padding: '11px',
            background: createMut.isPending ? colors.amberDim : colors.amber,
            border: 'none',
            borderRadius: radius.md,
            color: '#0B1220',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            cursor: createMut.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {createMut.isPending ? 'Guardando…' : 'Crear Puerto'}
        </button>
      </form>
    </div>
  )
}
