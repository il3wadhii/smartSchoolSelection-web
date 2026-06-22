'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setIsLoading(true)
    try {
      const response = await authAPI.forgotPassword(email)
      if (response.success) {
        setSent(true)
      } else {
        setError(response.message || 'Something went wrong. Please try again.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card p-8">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
              <MailCheck className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-xl font-bold text-secondary-900 mb-2">Check your email</h1>
            <p className="text-sm text-secondary-500 mb-6">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent password reset
              instructions to it.
            </p>
            <Link href="/login" className="btn-primary text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-secondary-900 mb-1">Forgot your password?</h1>
            <p className="text-sm text-secondary-500 mb-6">
              Enter your email and we&apos;ll send you reset instructions.
            </p>

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
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? 'Sending…' : 'Send reset email'}
              </button>
            </form>

            <p className="text-center text-sm text-secondary-500 mt-6">
              Remembered it?{' '}
              <Link href="/login" className="text-primary-600 font-medium hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
