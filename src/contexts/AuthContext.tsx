'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'
import { auth } from '@/lib/auth'

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
    if (savedUser && token) {
      setUser(savedUser)
    }
    setIsLoading(false)
  }, [])

  const login = (token: string, userData: User) => {
    auth.setAuth(token, userData)
    setUser(userData)
  }

  const logout = () => {
    auth.clearAuth()
    setUser(null)
    window.location.href = '/'
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
