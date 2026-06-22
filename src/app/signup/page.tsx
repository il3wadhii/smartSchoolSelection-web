'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.lastName || !form.email || !form.phone || !form.gender || !form.password) {
      setError('Please fill in all fields')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.register({
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        password: form.password,
      })
      if (!response.success) throw new Error(response.message || 'Registration failed')

      // Auto-login after successful registration
      const loginRes = await authAPI.login(form.email, form.password)
      if (loginRes.success && loginRes.data) {
        login(loginRes.data.accessToken, loginRes.data.user)
        router.push('/')
      } else {
        router.push('/login')
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.data?.errors
      setError(
        Array.isArray(apiErrors)
          ? apiErrors.join('. ')
          : err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Create your free account</h1>
        <p className="inline-flex items-center gap-1.5 text-sm text-primary-700 bg-primary-100 rounded-full px-3 py-1.5 mt-2">
          <Sparkles className="h-4 w-4" /> Unlock school fees &amp; live seat availability
        </p>
      </div>

      <div className="card p-8">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-accent-100 border border-accent-200 text-accent-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">First name</label>
              <input className="input-field" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Last name</label>
              <input className="input-field" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Email address</label>
            <input type="email" autoComplete="email" className="input-field" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Phone</label>
              <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+965…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Gender</label>
              <select className="input-field" value={form.gender} onChange={set('gender')}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input-field pr-10"
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-secondary-400 mt-1">Min 6 characters with upper, lower &amp; a number.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="input-field"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
