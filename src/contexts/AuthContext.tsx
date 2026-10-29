'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'
import { auth } from '@/lib/auth'
import { userAPI } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = auth.getUser()
    const token = auth.getToken()
    if (!savedUser || !token) {
      setIsLoading(false)
      return
    }
    // Show the saved user immediately for a fast UI, but VERIFY the token is
    // still valid. A stale/expired token (e.g. left over from an old session)
    // would otherwise make the app look logged-in while the API rejects it and
    // treats every request as a guest — so fees & seats silently disappear.
    setUser(savedUser)
    userAPI
      .profile()
      .then((res) => {
        if (res?.success && res.data) setUser(res.data as User)
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          auth.clearAuth()
          setUser(null)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = (token: string, userData: User) => {
    auth.setAuth(token, userData)
    setUser(userData)
  }

  const logout = () => {
    auth.clearAuth()
    setUser(null)
    // Land on the /preview home: it's the design under test, and the server
    // root just redirects there anyway (going via '/' also risks stale
    // browser caches of the old root URL).
    window.location.href = '/preview'
  }

  const updateUser = (userData: User) => {
    const token = auth.getToken()
    if (token) auth.setAuth(token, userData)
    setUser(userData)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
