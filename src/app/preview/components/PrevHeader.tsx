'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { User, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function PrevHeader() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="prev-header">
      <div className="prev-c row">
        <Link href="/preview" className="prev-brand" aria-label="Smart School Selection home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="prev-logoanim" src="/logo.png?v=2" alt="Smart School Selection logo" />
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
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="prev-signin">
                <User size={16} /> {user?.name ? user.name.split(' ')[0] : 'Account'}
              </Link>
              <button type="button" onClick={logout} className="btnT prev-signout">
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/preview/login" className="prev-signin">Sign in</Link>
              <Link href="/preview/signup" className="btnT">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
