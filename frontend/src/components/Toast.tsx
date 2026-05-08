'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { colors, fonts, radius } from '@/lib/styles'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const TYPE_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: `${colors.green}15`, border: `${colors.green}40`, text: colors.green },
  error:   { bg: `${colors.red}15`,   border: `${colors.red}40`,   text: colors.red   },
  info:    { bg: `${colors.blue}15`,  border: `${colors.blue}40`,  text: colors.blue  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const c = TYPE_COLORS[t.type]
          return (
            <div key={t.id} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: radius.md,
              padding: '10px 16px',
              color: c.text,
              fontFamily: fonts.body,
              fontSize: 13,
              maxWidth: 320,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.2s ease',
            }}>
              {t.message}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </ToastContext.Provider>
  )
}
