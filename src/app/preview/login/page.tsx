'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

function LoginInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const sp = useSearchParams()
  const { login, isAuthenticated } = useAuth()
  const nextUrl = sp.get('next') || '/preview'

  useEffect(() => {
    if (isAuthenticated) router.push(nextUrl)
  }, [isAuthenticated, router, nextUrl])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!email || !password) throw new Error('Please fill in all fields')
      const r = await authAPI.login(email, password)
      if (r.success && r.data) {
        login(r.data.accessToken, r.data.user)
        router.push(nextUrl)
      } else {
        throw new Error(r.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const signupHref = `/preview/signup${nextUrl !== '/preview' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`

  return (
    <section className="prev-section" style={{ minHeight: '68vh', display: 'flex', alignItems: 'center' }}>
      <div className="prev-c" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=2" alt="Smart School Selection" style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px' }} />
          <h1 className="prev-h2" style={{ margin: 0 }}>Welcome <span className="u">back</span></h1>
          <p className="prev-sub" style={{ margin: '6px auto 0' }}>Sign in to see fees, live seats and save your shortlist.</p>
        </div>

        <div className="prev-authcard">
          {error && <div className="prev-autherr">{error}</div>}
          <form onSubmit={submit}>
            <label className="prev-flabel">Email address</label>
            <input className="prev-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

            <label className="prev-flabel" style={{ marginTop: 14 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="prev-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btnT" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)', marginTop: 16 }}>
            New here? <Link href={signupHref} style={{ color: 'var(--teal)', fontWeight: 700 }}>Create a free account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default function PreviewLogin() {
  return <Suspense><LoginInner /></Suspense>
}
