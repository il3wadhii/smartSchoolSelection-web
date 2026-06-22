'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map as MapIcon, Scale, Heart } from 'lucide-react'

const TABS = [
  { href: '/preview', label: 'Home', icon: Home, exact: true },
  { href: '/preview/map', label: 'Map', icon: MapIcon },
  { href: '/preview/compare', label: 'Compare', icon: Scale },
  { href: '/preview/saved', label: 'Saved', icon: Heart },
]

// Mobile-only bottom navigation for the educational /preview site (the desktop
// top-nav is hidden on small screens). Hidden at lg+ via CSS.
export default function PrevTabBar() {
  const pathname = usePathname()
  return (
    <nav className="prev-tabbar" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname === t.href || pathname?.startsWith(t.href + '/')
        return (
          <Link key={t.href} href={t.href} className={`prev-tab ${active ? 'on' : ''}`}>
            <t.icon size={20} />
            <span>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
