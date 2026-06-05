import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ProvedorAuth, GuardAuth } from '@/componentes/provedores/provedor-auth'
import { ProvedorQuery } from '@/componentes/provedores/provedor-query'
import { ProvedorTema } from '@/componentes/provedores/provedor-tema'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
  display: "swap"
});

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: 'EduSaaS - Plataforma Educacional Inteligente',
  description: 'Plataforma educacional moderna com inteligência artificial para gestão de conteúdo, avaliações e comunicação',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f14' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`light ${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background min-h-screen text-[15px] tracking-[-0.01em]">
        <ProvedorQuery>
          <ProvedorAuth>
            <ProvedorTema
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <GuardAuth>{children}</GuardAuth>
              <Toaster />
            </ProvedorTema>
          </ProvedorAuth>
        </ProvedorQuery>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
