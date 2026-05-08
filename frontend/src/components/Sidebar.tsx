'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { colors, fonts, radius } from '@/lib/styles'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: '◈' },
  { href: '/terrestres',  label: 'Terrestres',  icon: '◉' },
  { href: '/maritimos',   label: 'Marítimos',   icon: '◈' },
  { href: '/clientes',    label: 'Clientes',    icon: '◎' },
  { href: '/productos',   label: 'Productos',   icon: '◉' },
  { href: '/bodegas',     label: 'Bodegas',     icon: '◈' },
  { href: '/puertos',     label: 'Puertos',     icon: '◎' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: colors.sidebar,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.amber, letterSpacing: '0.04em' }}>
          SLOGS
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textDim, marginTop: 2, letterSpacing: '0.08em' }}>
          SIATA LOGISTICS
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: radius.md,
                marginBottom: 2,
                background: active ? `${colors.amber}15` : 'transparent',
                color: active ? colors.amber : colors.textMuted,
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
                borderLeft: active ? `2px solid ${colors.amber}` : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.8 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status widget */}
      <div style={{
        padding: '14px 16px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: colors.green,
          boxShadow: `0 0 6px ${colors.green}`,
        }} />
        <div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fonts.body }}>Sistema</div>
          <div style={{ fontSize: 11, color: colors.green, fontFamily: fonts.mono }}>Online</div>
        </div>
      </div>
    </aside>
  )
}
