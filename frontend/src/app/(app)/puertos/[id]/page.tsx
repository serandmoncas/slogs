'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePuerto, useUpdatePuerto } from '@/hooks/usePuertos'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import LoadingSpinner from '@/components/LoadingSpinner'
import { colors, fonts, radius } from '@/lib/styles'

export default function EditPuertoPage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { data: puerto, isLoading } = usePuerto(id)
  const updateMut = useUpdatePuerto(id)
  const [form, setForm] = useState({
    nombre: '',
    ciudad: '',
    pais: '',
    codigo: '',
    tipo: 'NACIONAL',
  })
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (puerto)
      setForm({
        nombre: puerto.nombre,
        ciudad: puerto.ciudad,
        pais: puerto.pais,
        codigo: puerto.codigo,
        tipo: puerto.tipo,
      })
  }, [puerto])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    try {
      await updateMut.mutateAsync(form)
      router.push('/puertos')
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error.'
      )
    }
  }

  if (isLoading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <LoadingSpinner size={36} />
      </div>
    )

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
          Editar {puerto?.nombre}
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
          <FormInput label="Código" value={form.codigo} onChange={set('codigo')} />
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
          disabled={updateMut.isPending}
          style={{
            padding: '11px',
            background: updateMut.isPending ? colors.amberDim : colors.amber,
            border: 'none',
            borderRadius: radius.md,
            color: '#0B1220',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            cursor: updateMut.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {updateMut.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
