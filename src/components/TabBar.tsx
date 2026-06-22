'use client'

// Bottom tab bar: Home · Map · Compare (badge) · Saved.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useCompare } from '@/contexts/CompareContext'
import { useSaved } from '@/contexts/SavedContext'
import { Home, Map as MapIcon, Scale, Heart } from 'lucide-react'

function TabBarInner() {
  const pathname = usePathname()
  const { compareIds } = useCompare()
  const { savedIds } = useSaved()

  const tabs = [
    { key: 'home', label: 'Home', href: '/', icon: Home, active: pathname === '/' },
    { key: 'map', label: 'Map', href: '/map', icon: MapIcon, active: pathname === '/map' },
    { key: 'compare', label: 'Compare', href: '/compare', icon: Scale, active: pathname === '/compare', badge: compareIds.length },
    { key: 'saved', label: 'Saved', href: '/saved', icon: Heart, active: pathname === '/saved', badge: savedIds.length },
  ]

  // Hide on auth/admin-ish pages where it makes no sense
  if (['/login', '/signup', '/forgot-password'].includes(pathname)) return null

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line flex px-2 pt-2.5 pb-[max(env(safe-area-inset-bottom),14px)]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex-1 flex flex-col items-center gap-0.5 text-[10.5px] font-extrabold ${
            tab.active ? 'text-primary-600' : 'text-muted'
          }`}
        >
          <span className="relative">
            <tab.icon className={`h-[21px] w-[21px] ${tab.active ? '' : 'opacity-60'}`} />
            {tab.badge ? (
              <span className="absolute -top-1 -right-3 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-px font-extrabold">
                {tab.badge}
              </span>
            ) : null}
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

export default function TabBar() {
  return (
    <Suspense fallback={null}>
      <TabBarInner />
    </Suspense>
  )
}
