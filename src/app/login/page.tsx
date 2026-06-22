'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()
  const nextUrl = searchParams.get('next') || '/'

  useEffect(() => {
    if (isAuthenticated) router.push(nextUrl)
  }, [isAuthenticated, router, nextUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (!email || !password) throw new Error('Please fill in all fields')
      const response = await authAPI.login(email, password)
      if (response.success && response.data) {
        login(response.data.accessToken, response.data.user)
        router.push(nextUrl)
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Welcome back</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Log in to see fees, seat availability and write reviews.
        </p>
      </div>

      <div className="card p-8">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-accent-100 border border-accent-200 text-accent-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary-500 mt-6">
          New here?{' '}
          <Link href="/signup" className="text-primary-600 font-medium hover:underline">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-secondary-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
