'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'
import { colors, fonts, radius } from '@/lib/styles'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setToken(data.access_token)
      router.push('/dashboard')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }}>
      {/* Panel izquierdo — Radar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: 40,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes radar-sweep {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes blip {
            0%,100% { opacity:0; transform:scale(0); }
            50%     { opacity:1; transform:scale(1); }
          }
          .radar-sweep { animation: radar-sweep 3s linear infinite; transform-origin: 150px 150px; }
          .blip1 { animation: blip 3s ease-in-out 0.5s infinite; }
          .blip2 { animation: blip 3s ease-in-out 1.2s infinite; }
          .blip3 { animation: blip 3s ease-in-out 2.1s infinite; }
        `}</style>
        <svg viewBox="0 0 300 300" style={{ width: 280, height: 280, opacity: 0.85 }}>
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors.green} stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="url(#radar-bg)"
            stroke={`${colors.green}20`}
            strokeWidth="1"
          />
          {[110, 80, 50, 20].map((r) => (
            <circle
              key={r}
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke={`${colors.green}25`}
              strokeWidth="0.8"
              strokeDasharray="3,4"
            />
          ))}
          <line x1="10" y1="150" x2="290" y2="150" stroke={`${colors.green}15`} strokeWidth="0.5" />
          <line x1="150" y1="10" x2="150" y2="290" stroke={`${colors.green}15`} strokeWidth="0.5" />
          <g className="radar-sweep">
            <defs>
              <linearGradient
                id="sweep-grad"
                x1="150"
                y1="150"
                x2="290"
                y2="150"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={colors.green} stopOpacity="0.5" />
                <stop offset="100%" stopColor={colors.green} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M150,150 L290,150 A140,140,0,0,0,290,148 Z" fill="url(#sweep-grad)" />
            <line
              x1="150"
              y1="150"
              x2="290"
              y2="150"
              stroke={colors.green}
              strokeWidth="1.5"
              opacity="0.8"
            />
          </g>
          <circle className="blip1" cx="210" cy="105" r="4" fill={colors.amber} />
          <circle className="blip2" cx="178" cy="190" r="3" fill={colors.green} />
          <circle className="blip3" cx="95" cy="130" r="4" fill={colors.blue} />
        </svg>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 36,
              fontWeight: 700,
              color: colors.amber,
              letterSpacing: '0.06em',
            }}
          >
            SLOGS
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 6,
              letterSpacing: '0.1em',
            }}
          >
            SIATA LOGISTICS SYSTEM
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.textDim,
              marginTop: 16,
              maxWidth: 220,
              lineHeight: 1.6,
            }}
          >
            Gestión integral de envíos terrestres y marítimos
          </div>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 28,
              fontWeight: 700,
              color: colors.text,
              marginBottom: 6,
            }}
          >
            Iniciar sesión
          </h1>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.textMuted,
              marginBottom: 32,
            }}
          >
            Accede al sistema de gestión logística
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: colors.textMuted,
                  fontFamily: fonts.body,
                  marginBottom: 6,
                }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="usuario@siata.co"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: colors.panel,
                  border: `1px solid ${error ? colors.red : colors.border}`,
                  borderRadius: radius.md,
                  color: colors.text,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: colors.textMuted,
                  fontFamily: fonts.body,
                  marginBottom: 6,
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: colors.panel,
                  border: `1px solid ${error ? colors.red : colors.border}`,
                  borderRadius: radius.md,
                  color: colors.text,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: `${colors.red}15`,
                  border: `1px solid ${colors.red}40`,
                  borderRadius: radius.md,
                  color: colors.red,
                  fontSize: 13,
                  fontFamily: fonts.body,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                background: loading ? colors.amberDim : colors.amber,
                border: 'none',
                borderRadius: radius.md,
                color: '#0B1220',
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
