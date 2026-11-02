'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

function SignupInner() {
  const [form, setForm] = useState({ name: '', lastName: '', email: '', phone: '', gender: '', password: '', confirmPassword: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const sp = useSearchParams()
  const { login, isAuthenticated } = useAuth()
  const nextUrl = sp.get('next') || '/preview'

  useEffect(() => {
    if (isAuthenticated) router.push(nextUrl)
  }, [isAuthenticated, router, nextUrl])

  // Warn before leaving a half-filled form.
  const dirty = !done && Object.values(form).some(Boolean)
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.lastName || !form.email || !form.phone || !form.gender || !form.password) {
      setError('Please fill in every field, then try again.'); firstRef.current?.focus(); return
    }
    if (form.password !== form.confirmPassword) { setError('The two passwords do not match. Re-enter them.'); return }
    setLoading(true)
    try {
      const res = await authAPI.register({ name: form.name, lastName: form.lastName, email: form.email, phone: form.phone, gender: form.gender, password: form.password })
      if (!res.success) throw new Error(res.message || 'Registration failed')
      const loginRes = await authAPI.login(form.email, form.password)
      if (loginRes.success && loginRes.data) {
        setDone(true)
        login(loginRes.data.accessToken, loginRes.data.user)
        router.push(nextUrl)
      } else {
        setDone(true)
        router.push('/preview/login')
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.data?.errors
      setError(Array.isArray(apiErrors) ? apiErrors.join('. ') : err.response?.data?.message || err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loginHref = `/preview/login${nextUrl !== '/preview' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`

  return (
    <section className="prev-section" style={{ paddingTop: 30 }}>
      <div className="prev-c" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=2" alt="Smart School Selection" width={56} height={56} fetchPriority="high" style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px' }} />
          <h1 className="prev-h2" style={{ margin: 0 }}>Create your <span className="u">free account</span></h1>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--oranged)', background: 'var(--otint)', padding: '6px 13px', borderRadius: 20, marginTop: 10 }}>
            <Sparkles size={15} /> Unlock fees &amp; live seat availability
          </p>
        </div>

        <div className="prev-authcard">
          {error && <div className="prev-autherr" role="alert">{error}</div>}
          <form onSubmit={submit} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="prev-flabel" htmlFor="su-name">First name</label><input ref={firstRef} id="su-name" name="given-name" autoComplete="given-name" className="prev-input" value={form.name} onChange={set('name')} placeholder="Noura…" /></div>
              <div><label className="prev-flabel" htmlFor="su-last">Last name</label><input id="su-last" name="family-name" autoComplete="family-name" className="prev-input" value={form.lastName} onChange={set('lastName')} placeholder="Al-Ahmad…" /></div>
            </div>
            <label className="prev-flabel" htmlFor="su-email" style={{ marginTop: 14 }}>Email address</label>
            <input id="su-email" name="email" className="prev-input" type="email" inputMode="email" autoComplete="email" spellCheck={false} autoCapitalize="none" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div><label className="prev-flabel" htmlFor="su-phone">Phone</label><input id="su-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" className="prev-input" value={form.phone} onChange={set('phone')} placeholder="+965 5XXX XXXX…" /></div>
              <div><label className="prev-flabel" htmlFor="su-gender">Gender</label>
                <select id="su-gender" name="sex" autoComplete="sex" className="prev-input" value={form.gender} onChange={set('gender')}>
                  <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
            </div>
            <label className="prev-flabel" htmlFor="su-password" style={{ marginTop: 14 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input id="su-password" name="new-password" className="prev-input" type={show ? 'text' : 'password'} autoComplete="new-password" aria-describedby="su-pw-hint" value={form.password} onChange={set('password')} style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p id="su-pw-hint" style={{ fontSize: 12, color: 'var(--muted)', margin: '5px 0 0' }}>Min 6 characters with an upper, lower &amp; a number.</p>
            <label className="prev-flabel" htmlFor="su-confirm" style={{ marginTop: 14 }}>Confirm password</label>
            <input id="su-confirm" name="confirm-password" className="prev-input" type={show ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />

            <button type="submit" className="btnO" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)', marginTop: 16 }}>
            Already have an account? <Link href={loginHref} style={{ color: 'var(--teal)', fontWeight: 700 }}>Log in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default function PreviewSignup() {
  return <Suspense><SignupInner /></Suspense>
}
