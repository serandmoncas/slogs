'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEnvioMaritimo, useUpdateEnvioMaritimo } from '@/hooks/useEnviosMaritimos'
import { useClientes } from '@/hooks/useClientes'
import { useProductos } from '@/hooks/useProductos'
import { usePuertos } from '@/hooks/usePuertos'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { colors, fonts, radius } from '@/lib/styles'
import type { EstadoEnvio } from '@/types'

const ESTADOS = ['PENDIENTE', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO']

export default function EditMaritimoPage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { data: envio, isLoading } = useEnvioMaritimo(id)
  const updateMut = useUpdateEnvioMaritimo(id)
  const { data: clientes } = useClientes({ size: 100 })
  const { data: productos } = useProductos({ size: 100 })
  const { data: puertos } = usePuertos({ size: 100 })

  const [form, setForm] = useState({
    numero_guia: '',
    cliente_id: '',
    producto_id: '',
    puerto_id: '',
    cantidad: '',
    fecha_entrega: '',
    precio_envio: '',
    numero_flota: '',
    estado: '',
  })
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (envio)
      setForm({
        numero_guia: envio.numero_guia,
        cliente_id: String(envio.cliente.id),
        producto_id: String(envio.producto.id),
        puerto_id: String(envio.puerto.id),
        cantidad: String(envio.cantidad),
        fecha_entrega: envio.fecha_entrega,
        precio_envio: envio.precio_envio,
        numero_flota: envio.numero_flota,
        estado: envio.estado,
      })
  }, [envio])

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
        puerto_id: Number(form.puerto_id),
        cantidad: Number(form.cantidad),
        fecha_entrega: form.fecha_entrega,
        precio_envio: form.precio_envio,
        numero_flota: form.numero_flota,
        estado: form.estado,
      })
      router.push('/maritimos')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail ?? 'Error al actualizar.')
    }
  }

  if (isLoading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <LoadingSpinner size={36} />
      </div>
    )

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link
          href="/maritimos"
          style={{ color: colors.textMuted, textDecoration: 'none', fontSize: 13 }}
        >
          ← Marítimos
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
          Editar {envio?.numero_guia}
        </h1>
        {envio && <StatusBadge estado={envio.estado as EstadoEnvio} />}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            label="Número de guía"
            value={form.numero_guia}
            onChange={set('numero_guia')}
            maxLength={10}
          />
          <FormInput
            label="Número de flota"
            value={form.numero_flota}
            onChange={set('numero_flota')}
            hint="Formato: ABC1234D"
          />
        </div>
        <FormSelect
          label="Cliente"
          value={form.cliente_id}
          onChange={set('cliente_id')}
          options={(clientes?.items ?? []).map((c) => ({ value: String(c.id), label: c.nombre }))}
          placeholder="Seleccionar…"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormSelect
            label="Producto"
            value={form.producto_id}
            onChange={set('producto_id')}
            options={(productos?.items ?? []).map((p) => ({
              value: String(p.id),
              label: p.nombre,
            }))}
            placeholder="Seleccionar…"
          />
          <FormSelect
            label="Puerto"
            value={form.puerto_id}
            onChange={set('puerto_id')}
            options={(puertos?.items ?? []).map((p) => ({
              value: String(p.id),
              label: `${p.nombre} (${p.codigo})`,
            }))}
            placeholder="Seleccionar…"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <FormInput
            label="Cantidad"
            type="number"
            min="1"
            value={form.cantidad}
            onChange={set('cantidad')}
          />
          <FormInput
            label="Precio envío"
            type="number"
            step="0.01"
            value={form.precio_envio}
            onChange={set('precio_envio')}
          />
          <FormInput
            label="Fecha entrega"
            type="date"
            value={form.fecha_entrega}
            onChange={set('fecha_entrega')}
          />
          <FormSelect
            label="Estado"
            value={form.estado}
            onChange={set('estado')}
            options={ESTADOS.map((e) => ({ value: e, label: e }))}
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
            background: updateMut.isPending ? colors.amberDim : colors.blue,
            border: 'none',
            borderRadius: radius.md,
            color: '#0B1220',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            cursor: updateMut.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {updateMut.isPending ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  )
}
