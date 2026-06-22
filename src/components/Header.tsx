'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCompare } from '@/contexts/CompareContext'
import { useSaved } from '@/contexts/SavedContext'
import { Scale, User as UserIcon, LogOut, Star, ChevronDown, Menu, X, Heart, Map as MapIcon } from 'lucide-react'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { compareIds } = useCompare()
  const { savedIds } = useSaved()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Smart School Selection" width={36} height={36} className="h-9 w-auto" />
            <div className="leading-tight">
              <span className="block text-base font-bold text-primary-600">Smart School Selection</span>
              <span className="hidden sm:block text-[11px] text-secondary-400">Find the right school in Kuwait</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <MapIcon className="h-4 w-4" />
              Map
            </Link>
            <Link
              href="/saved"
              className="relative inline-flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Heart className="h-4 w-4" />
              Saved
              {savedIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-accent-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {savedIds.length}
                </span>
              )}
            </Link>
            <Link
              href="/compare"
              className="relative inline-flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Scale className="h-4 w-4" />
              Compare
              {compareIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-accent-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {compareIds.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 text-sm text-secondary-700 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="hidden lg:block">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-secondary-400" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 card py-1 z-50"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-gray-100"
                    >
                      <UserIcon className="h-4 w-4" /> My profile
                    </Link>
                    <Link
                      href="/my-reviews"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-gray-100"
                    >
                      <Star className="h-4 w-4" /> My reviews
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-lg hover:bg-gray-100">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary text-sm">
                  Sign up free
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          <Link href="/map" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
            Map
          </Link>
          <Link href="/saved" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
            Saved {savedIds.length > 0 && `(${savedIds.length})`}
          </Link>
          <Link href="/compare" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
            Compare {compareIds.length > 0 && `(${compareIds.length})`}
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
                My profile
              </Link>
              <Link href="/my-reviews" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
                My reviews
              </Link>
              <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-accent-600 hover:bg-gray-100">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-secondary-700 hover:bg-gray-100">
                Log in
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg bg-primary-500 text-white text-center font-medium">
                Sign up free
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
