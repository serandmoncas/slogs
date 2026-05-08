'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateCliente } from '@/hooks/useClientes'
import FormInput from '@/components/FormInput'
import { colors, fonts, radius } from '@/lib/styles'

export default function NuevoClientePage() {
  const router = useRouter()
  const createMut = useCreateCliente()
  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => {
      const n = { ...er }
      delete n[field]
      return n
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!form.nombre) err.nombre = 'Requerido'
    if (!form.nit) err.nit = 'Requerido'
    if (!form.email) err.email = 'Requerido'
    if (!form.telefono) err.telefono = 'Requerido'
    if (!form.direccion) err.direccion = 'Requerido'
    if (!form.ciudad) err.ciudad = 'Requerido'
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    setApiError('')
    try {
      await createMut.mutateAsync(form)
      router.push('/clientes')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al crear el cliente.')
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link
          href="/clientes"
          style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}
        >
          ← Clientes
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
          Nuevo Cliente
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
        <FormInput
          label="Nombre / Razón social"
          value={form.nombre}
          onChange={set('nombre')}
          error={errors.nombre}
        />
        <FormInput
          label="NIT"
          value={form.nit}
          onChange={set('nit')}
          error={errors.nit}
          hint="Ejemplo: 900123456-1"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <FormInput
            label="Teléfono"
            value={form.telefono}
            onChange={set('telefono')}
            error={errors.telefono}
          />
        </div>
        <FormInput
          label="Dirección"
          value={form.direccion}
          onChange={set('direccion')}
          error={errors.direccion}
        />
        <FormInput
          label="Ciudad"
          value={form.ciudad}
          onChange={set('ciudad')}
          error={errors.ciudad}
        />
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
          {createMut.isPending ? 'Guardando…' : 'Crear Cliente'}
        </button>
      </form>
    </div>
  )
}
