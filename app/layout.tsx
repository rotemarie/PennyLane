import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'PennyLane',
  description: 'Personal spending tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PennyLane',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
            <div className="max-w-lg mx-auto px-4 py-3">
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-emerald-400">Penny</span>Lane
              </h1>
            </div>
          </header>
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
