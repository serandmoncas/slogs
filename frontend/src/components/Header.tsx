'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { colors, fonts } from '@/lib/styles'
import { clearToken } from '@/lib/auth'

const LABELS: Record<string, string> = {
  dashboard:  'Dashboard',
  terrestres: 'Envíos Terrestres',
  maritimos:  'Envíos Marítimos',
  clientes:   'Clientes',
  productos:  'Productos',
  bodegas:    'Bodegas',
  puertos:    'Puertos',
  nuevo:      'Nuevo',
}

function buildBreadcrumb(pathname: string): string[] {
  return pathname.split('/').filter(Boolean).map((seg) => {
    if (/^\d+$/.test(seg)) return 'Editar'
    return LABELS[seg] ?? seg
  })
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('es-CO', { hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const crumbs = buildBreadcrumb(pathname)

  const handleLogout = () => {
    clearToken()
    router.push('/login')
  }

  return (
    <header style={{
      height: 52,
      background: colors.panel,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: fonts.body, fontSize: 13 }}>
        <span style={{ color: colors.textDim }}>SLOGS</span>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: colors.border }}>›</span>
            <span style={{ color: i === crumbs.length - 1 ? colors.text : colors.textMuted }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Reloj */}
        <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, letterSpacing: '0.05em' }}>
          {clock}
        </span>

        {/* User badge + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${colors.amber}25`,
            border: `1px solid ${colors.amber}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.amber, fontSize: 12, fontWeight: 700,
          }}>
            U
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              padding: '4px 10px',
              color: colors.textMuted,
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: fonts.body,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.red; e.currentTarget.style.color = colors.red }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
