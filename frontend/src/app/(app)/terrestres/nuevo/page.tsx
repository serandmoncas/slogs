'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateEnvioTerrestre } from '@/hooks/useEnviosTerrestres'
import { useClientes } from '@/hooks/useClientes'
import { useProductos } from '@/hooks/useProductos'
import { useBodegas } from '@/hooks/useBodegas'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import DiscountBadge from '@/components/DiscountBadge'
import { colors, fonts, radius } from '@/lib/styles'
import { formatCOP } from '@/lib/format'

export default function NuevoTerrestrePage() {
  const router = useRouter()
  const createMut = useCreateEnvioTerrestre()
  const { data: clientes } = useClientes({ size: 100 })
  const { data: productos } = useProductos({ size: 100 })
  const { data: bodegas } = useBodegas({ size: 100 })

  const [form, setForm] = useState({
    numero_guia: '',
    cliente_id: '',
    producto_id: '',
    bodega_id: '',
    cantidad: '',
    fecha_entrega: '',
    precio_envio: '',
    placa: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const cantidad = Number(form.cantidad) || 0
  const precioEnvio = Number(form.precio_envio) || 0
  const descuentoPct = cantidad > 10 ? 5 : 0
  const precioFinal = precioEnvio * (1 - descuentoPct / 100)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => {
      const n = { ...er }
      delete n[field]
      return n
    })
  }

  const validate = () => {
    const err: Record<string, string> = {}
    if (!form.numero_guia) err.numero_guia = 'Requerido'
    if (!form.cliente_id) err.cliente_id = 'Requerido'
    if (!form.producto_id) err.producto_id = 'Requerido'
    if (!form.bodega_id) err.bodega_id = 'Requerido'
    if (!form.cantidad || Number(form.cantidad) < 1) err.cantidad = 'Debe ser mayor a 0'
    if (!form.fecha_entrega) err.fecha_entrega = 'Requerido'
    if (!form.precio_envio || Number(form.precio_envio) <= 0)
      err.precio_envio = 'Debe ser mayor a 0'
    if (!form.placa) err.placa = 'Requerido'
    else if (!/^[A-Z]{3}[0-9]{3}$/.test(form.placa)) err.placa = 'Formato: ABC123'
    return err
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    setApiError('')
    try {
      await createMut.mutateAsync({
        numero_guia: form.numero_guia,
        cliente_id: Number(form.cliente_id),
        producto_id: Number(form.producto_id),
        bodega_id: Number(form.bodega_id),
        cantidad: Number(form.cantidad),
        fecha_entrega: form.fecha_entrega,
        precio_envio: form.precio_envio,
        placa: form.placa,
      })
      router.push('/terrestres')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al crear el envío.')
    }
  }

  const clienteOpts = (clientes?.items ?? []).map((c) => ({
    value: String(c.id),
    label: `${c.nombre} — ${c.nit}`,
  }))
  const productoOpts = (productos?.items ?? []).map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }))
  const bodegaOpts = (bodegas?.items ?? []).map((b) => ({
    value: String(b.id),
    label: `${b.nombre} (${b.ciudad})`,
  }))

  return (
    <div style={{ maxWidth: 960, display: 'flex', gap: 24 }}>
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link
            href="/terrestres"
            style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}
          >
            ← Terrestres
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
            Nuevo Envío Terrestre
          </h1>
        </div>

        <div
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormInput
              label="Número de guía"
              value={form.numero_guia}
              onChange={set('numero_guia')}
              error={errors.numero_guia}
              hint="Máx. 10 caracteres"
              maxLength={10}
            />
            <FormInput
              label="Placa"
              value={form.placa}
              onChange={set('placa')}
              error={errors.placa}
              hint="Formato: ABC123"
              placeholder="ABC123"
            />
          </div>
          <FormSelect
            label="Cliente"
            value={form.cliente_id}
            onChange={set('cliente_id')}
            options={clienteOpts}
            error={errors.cliente_id}
            placeholder="Seleccionar cliente…"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormSelect
              label="Producto"
              value={form.producto_id}
              onChange={set('producto_id')}
              options={productoOpts}
              error={errors.producto_id}
              placeholder="Seleccionar producto…"
            />
            <FormSelect
              label="Bodega"
              value={form.bodega_id}
              onChange={set('bodega_id')}
              options={bodegaOpts}
              error={errors.bodega_id}
              placeholder="Seleccionar bodega…"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormInput
              label="Cantidad"
              type="number"
              min="1"
              value={form.cantidad}
              onChange={set('cantidad')}
              error={errors.cantidad}
            />
            <FormInput
              label="Precio de envío (COP)"
              type="number"
              min="0.01"
              step="0.01"
              value={form.precio_envio}
              onChange={set('precio_envio')}
              error={errors.precio_envio}
            />
            <FormInput
              label="Fecha de entrega"
              type="date"
              value={form.fecha_entrega}
              onChange={set('fecha_entrega')}
              error={errors.fecha_entrega}
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
            {createMut.isPending ? 'Guardando…' : 'Crear Envío'}
          </button>
        </div>
      </form>

      {/* Panel resumen sticky */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          position: 'sticky',
          top: 24,
          alignSelf: 'flex-start',
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 20,
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 13,
            fontWeight: 600,
            color: colors.textMuted,
            letterSpacing: '0.07em',
            marginBottom: 16,
          }}
        >
          RESUMEN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Cantidad', value: cantidad || '—' },
            { label: 'Precio envío', value: precioEnvio ? formatCOP(precioEnvio) : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                fontFamily: fonts.body,
              }}
            >
              <span style={{ color: colors.textMuted }}>{label}</span>
              <span style={{ color: colors.text }}>{value}</span>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              fontFamily: fonts.body,
            }}
          >
            <span style={{ color: colors.textMuted }}>Descuento</span>
            {descuentoPct > 0 ? (
              <DiscountBadge pct={descuentoPct} />
            ) : (
              <span style={{ color: colors.textDim }}>0%</span>
            )}
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: fonts.body, fontWeight: 600, color: colors.text }}>
              Total
            </span>
            <span
              style={{ fontFamily: fonts.mono, fontSize: 16, fontWeight: 700, color: colors.amber }}
            >
              {precioFinal ? formatCOP(precioFinal) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
