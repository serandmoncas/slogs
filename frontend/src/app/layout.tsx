import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'SLOGS — Siata Logistics',
  description: 'Sistema de gestión logística',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: '#0B1220', color: '#F1F5F9' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
