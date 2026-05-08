'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import LoadingSpinner from './LoadingSpinner'
import { colors } from '@/lib/styles'
import { getToken } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: colors.bg,
      }}>
        <LoadingSpinner size={36} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
