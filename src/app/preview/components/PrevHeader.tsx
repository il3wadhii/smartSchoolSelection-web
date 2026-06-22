'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { User } from 'lucide-react'

export default function PrevHeader() {
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="prev-header">
      <div className="prev-c row">
        <Link href="/preview" className="prev-brand" aria-label="Smart School Selection home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="prev-logoanim" src="/logo.png" alt="Smart School Selection logo" />
          <span className="wm">Smart School<small>SELECTION</small></span>
        </Link>
        <nav className="prev-nav">
          <Link href="/preview#schools">Find schools</Link>
          <Link href="/preview/map">Map</Link>
          <Link href="/preview/compare">Compare</Link>
          <Link href="/preview/saved">Saved</Link>
          <Link href="/preview#about">About</Link>
        </nav>
        <div className="prev-actions">
          {isAuthenticated ? (
            <Link href="/profile" className="prev-signin">
              <User size={16} /> {user?.name ? user.name.split(' ')[0] : 'Account'}
            </Link>
          ) : (
            <Link href="/login?next=/preview" className="prev-signin">Sign in</Link>
          )}
          <Link href="/signup?next=/preview" className="btnT">Get started</Link>
        </div>
      </div>
    </header>
  )
}
