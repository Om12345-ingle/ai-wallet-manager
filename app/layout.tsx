import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import '../styles/kiro-theme.css'
import { AppProvider } from '../contexts/AppContext'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Wallet Manager',
  description: 'Stellar wallet with AI-powered natural language commands',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="kiro-dark" className="bg-black">
      <head>
        <script src="/csp-override.js" async />
      </head>
      <body className={`${inter.className} kiro-scrollbar`}>
        <a href="#main-content" className="skip-link">
          Skip To Main Content
        </a>
        <AppProvider>
          <main id="main-content">{children}</main>
        </AppProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
