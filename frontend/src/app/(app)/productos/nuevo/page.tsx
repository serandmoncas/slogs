'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateProducto } from '@/hooks/useProductos'
import FormInput from '@/components/FormInput'
import { colors, fonts, radius } from '@/lib/styles'

export default function NuevoProductoPage() {
  const router = useRouter()
  const createMut = useCreateProducto()
  const [form, setForm] = useState({ nombre: '', categoria: '', descripcion: '' })
  const [apiError, setApiError] = useState('')

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setApiError('')
    try { await createMut.mutateAsync({ ...form, descripcion: form.descripcion || null }); router.push('/productos') }
    catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al crear.')
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link href="/productos" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}>← Productos</Link>
        <h1 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Nuevo Producto</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormInput label="Nombre" value={form.nombre} onChange={set('nombre')} />
        <FormInput label="Categoría" value={form.categoria} onChange={set('categoria')} />
        <FormInput label="Descripción (opcional)" value={form.descripcion} onChange={set('descripcion')} />
        {apiError && <div style={{ padding: '10px 14px', background: `${colors.red}15`, border: `1px solid ${colors.red}40`, borderRadius: radius.md, color: colors.red, fontSize: 13 }}>{apiError}</div>}
        <button type="submit" disabled={createMut.isPending} style={{ padding: '11px', background: createMut.isPending ? colors.amberDim : colors.amber, border: 'none', borderRadius: radius.md, color: '#0B1220', fontFamily: fonts.display, fontWeight: 700, fontSize: 15, cursor: createMut.isPending ? 'not-allowed' : 'pointer' }}>
          {createMut.isPending ? 'Guardando…' : 'Crear Producto'}
        </button>
      </form>
    </div>
  )
}
