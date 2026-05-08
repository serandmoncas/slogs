'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCliente, useUpdateCliente } from '@/hooks/useClientes'
import FormInput from '@/components/FormInput'
import LoadingSpinner from '@/components/LoadingSpinner'
import { colors, fonts, radius } from '@/lib/styles'

export default function EditClientePage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { data: cliente, isLoading } = useCliente(id)
  const updateMut = useUpdateCliente(id)
  const [form, setForm] = useState({ nombre: '', nit: '', email: '', telefono: '', direccion: '', ciudad: '' })
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (cliente) setForm({ nombre: cliente.nombre, nit: cliente.nit, email: cliente.email, telefono: cliente.telefono, direccion: cliente.direccion, ciudad: cliente.ciudad })
  }, [cliente])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setApiError('')
    try { await updateMut.mutateAsync(form); router.push('/clientes') }
    catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al actualizar.')
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link href="/clientes" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}>← Clientes</Link>
        <h1 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Editar {cliente?.nombre}</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormInput label="Nombre / Razón social" value={form.nombre} onChange={set('nombre')} />
        <FormInput label="NIT" value={form.nit} onChange={set('nit')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput label="Correo electrónico" type="email" value={form.email} onChange={set('email')} />
          <FormInput label="Teléfono" value={form.telefono} onChange={set('telefono')} />
        </div>
        <FormInput label="Dirección" value={form.direccion} onChange={set('direccion')} />
        <FormInput label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
        {apiError && <div style={{ padding: '10px 14px', background: `${colors.red}15`, border: `1px solid ${colors.red}40`, borderRadius: radius.md, color: colors.red, fontSize: 13 }}>{apiError}</div>}
        <button type="submit" disabled={updateMut.isPending} style={{ padding: '11px', background: updateMut.isPending ? colors.amberDim : colors.amber, border: 'none', borderRadius: radius.md, color: '#0B1220', fontFamily: fonts.display, fontWeight: 700, fontSize: 15, cursor: updateMut.isPending ? 'not-allowed' : 'pointer' }}>
          {updateMut.isPending ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  )
}
