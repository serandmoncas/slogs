'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEnvioTerrestre, useUpdateEnvioTerrestre } from '@/hooks/useEnviosTerrestres'
import { useClientes } from '@/hooks/useClientes'
import { useProductos } from '@/hooks/useProductos'
import { useBodegas } from '@/hooks/useBodegas'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import DiscountBadge from '@/components/DiscountBadge'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { colors, fonts, radius } from '@/lib/styles'
import { formatCOP } from '@/lib/format'
import type { EstadoEnvio } from '@/types'

const ESTADOS = ['PENDIENTE', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO']

export default function EditTerrestrePage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { data: envio, isLoading } = useEnvioTerrestre(id)
  const updateMut = useUpdateEnvioTerrestre(id)
  const { data: clientes } = useClientes({ size: 100 })
  const { data: productos } = useProductos({ size: 100 })
  const { data: bodegas } = useBodegas({ size: 100 })

  const [form, setForm] = useState({
    numero_guia: '', cliente_id: '', producto_id: '', bodega_id: '',
    cantidad: '', fecha_entrega: '', precio_envio: '', placa: '', estado: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (envio) setForm({
      numero_guia: envio.numero_guia,
      cliente_id: String(envio.cliente.id),
      producto_id: String(envio.producto.id),
      bodega_id: String(envio.bodega.id),
      cantidad: String(envio.cantidad),
      fecha_entrega: envio.fecha_entrega,
      precio_envio: envio.precio_envio,
      placa: envio.placa,
      estado: envio.estado,
    })
  }, [envio])

  const cantidad = Number(form.cantidad) || 0
  const precioEnvio = Number(form.precio_envio) || 0
  const descuentoPct = cantidad > 10 ? 5 : 0
  const precioFinal = precioEnvio * (1 - descuentoPct / 100)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    try {
      await updateMut.mutateAsync({
        numero_guia: form.numero_guia,
        cliente_id: Number(form.cliente_id),
        producto_id: Number(form.producto_id),
        bodega_id: Number(form.bodega_id),
        cantidad: Number(form.cantidad),
        fecha_entrega: form.fecha_entrega,
        precio_envio: form.precio_envio,
        placa: form.placa,
        estado: form.estado,
      })
      router.push('/terrestres')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al actualizar el envío.')
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>

  const clienteOpts = (clientes?.items ?? []).map((c) => ({ value: String(c.id), label: `${c.nombre} — ${c.nit}` }))
  const productoOpts = (productos?.items ?? []).map((p) => ({ value: String(p.id), label: p.nombre }))
  const bodegaOpts = (bodegas?.items ?? []).map((b) => ({ value: String(b.id), label: `${b.nombre} (${b.ciudad})` }))
  const estadoOpts = ESTADOS.map((e) => ({ value: e, label: e }))

  return (
    <div style={{ maxWidth: 960, display: 'flex', gap: 24 }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link href="/terrestres" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}>← Terrestres</Link>
          <h1 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>
            Editar {envio?.numero_guia}
          </h1>
          {envio && <StatusBadge estado={envio.estado as EstadoEnvio} />}
        </div>

        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormInput label="Número de guía" value={form.numero_guia} onChange={set('numero_guia')} maxLength={10} />
            <FormInput label="Placa" value={form.placa} onChange={set('placa')} error={errors.placa} hint="Formato: ABC123" />
          </div>
          <FormSelect label="Cliente" value={form.cliente_id} onChange={set('cliente_id')} options={clienteOpts} placeholder="Seleccionar…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormSelect label="Producto" value={form.producto_id} onChange={set('producto_id')} options={productoOpts} placeholder="Seleccionar…" />
            <FormSelect label="Bodega" value={form.bodega_id} onChange={set('bodega_id')} options={bodegaOpts} placeholder="Seleccionar…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <FormInput label="Cantidad" type="number" min="1" value={form.cantidad} onChange={set('cantidad')} />
            <FormInput label="Precio envío" type="number" min="0.01" step="0.01" value={form.precio_envio} onChange={set('precio_envio')} />
            <FormInput label="Fecha entrega" type="date" value={form.fecha_entrega} onChange={set('fecha_entrega')} />
            <FormSelect label="Estado" value={form.estado} onChange={set('estado')} options={estadoOpts} />
          </div>
          {apiError && (
            <div style={{ padding: '10px 14px', background: `${colors.red}15`, border: `1px solid ${colors.red}40`, borderRadius: radius.md, color: colors.red, fontSize: 13 }}>{apiError}</div>
          )}
          <button type="submit" disabled={updateMut.isPending}
            style={{ padding: '11px', background: updateMut.isPending ? colors.amberDim : colors.amber, border: 'none', borderRadius: radius.md, color: '#0B1220', fontFamily: fonts.display, fontWeight: 700, fontSize: 15, cursor: updateMut.isPending ? 'not-allowed' : 'pointer' }}>
            {updateMut.isPending ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 20 }}>
        <div style={{ fontFamily: fonts.display, fontSize: 13, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.07em', marginBottom: 16 }}>RESUMEN</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ label: 'Cantidad', value: cantidad || '—' }, { label: 'Precio envío', value: precioEnvio ? formatCOP(precioEnvio) : '—' }].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: fonts.body }}>
              <span style={{ color: colors.textMuted }}>{label}</span>
              <span style={{ color: colors.text }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: colors.textMuted, fontFamily: fonts.body }}>Descuento</span>
            {descuentoPct > 0 ? <DiscountBadge pct={descuentoPct} /> : <span style={{ color: colors.textDim }}>0%</span>}
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: fonts.body, fontWeight: 600, color: colors.text }}>Total</span>
            <span style={{ fontFamily: fonts.mono, fontSize: 16, fontWeight: 700, color: colors.amber }}>{precioFinal ? formatCOP(precioFinal) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
