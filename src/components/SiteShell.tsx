'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import TabBar from './TabBar'
import AssistantWidget from './AssistantWidget'

// The /preview redesign brings its own header/footer/shell, so we suppress the
// normal site chrome there. Everything else keeps the current layout.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/preview')) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col pb-[68px] lg:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <TabBar />
      <AssistantWidget />
    </div>
  )
}
