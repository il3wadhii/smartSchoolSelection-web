import type { Metadata } from 'next'
import { Nunito_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CompareProvider } from '@/contexts/CompareContext'
import { SavedProvider } from '@/contexts/SavedContext'
import SiteShell from '@/components/SiteShell'

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
})
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fraunces',
})

export const metadata: Metadata = {
  title: 'Smart School Selection - Find the Right School in Kuwait',
  description:
    'Browse and compare schools in Kuwait: curriculum, languages, location, reviews — plus fees and seat availability with a free account.',
  keywords: ['school', 'education', 'kuwait', 'compare schools', 'school fees', 'seat availability'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${fraunces.variable} font-sans`}>
        <AuthProvider>
          <CompareProvider>
            <SavedProvider>
            <SiteShell>{children}</SiteShell>
            </SavedProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
