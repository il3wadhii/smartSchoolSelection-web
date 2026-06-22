'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCompare } from '@/contexts/CompareContext'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { schoolStages, EXACT_GRADES, STAGE_LABEL, StageKey } from '@/lib/stages'
import { X, Check, Scale } from 'lucide-react'

interface ComparisonSchool {
  schoolID: number
  schoolName: string
  area: string
  system: string
  classSize: number
  educationalStage: string
  schoolImgURL?: string
  rating: { average: number | string; totalReviews: number }
  gradeFees: Array<{ grade: string; fees: number }>
  seatsByGrade: Record<string, number>
}

const GRADE_KEY = 'compare_grade'
const STAGE_DOT: Record<StageKey, string> = { nur: '#F4961E', kg: '#5DCAA5', pri: '#1F8A78', int: '#3E7CB1', high: '#155E51' }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PreviewCompare() {
  const { compareIds, toggleCompare, removeCompare, clearCompare, maxReached } = useCompare()
  const [grade, setGrade] = useState('')
  const [allSchools, setAllSchools] = useState<Array<{ schoolID: number; schoolName: string }>>([])
  const [schools, setSchools] = useState<ComparisonSchool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try { const s = localStorage.getItem(GRADE_KEY); if (s && EXACT_GRADES.includes(s)) setGrade(s) } catch {}
  }, [])
  const chooseGrade = (g: string) => { setGrade(g); try { localStorage.setItem(GRADE_KEY, g) } catch {} }

  useEffect(() => {
    let cancelled = false
    schoolsAPI.list(1, 200).then((res) => {
      if (!cancelled && res.success && res.data) setAllSchools(res.data.schools || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (compareIds.length < 2) { setSchools([]); return }
    let cancelled = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await schoolsAPI.compare(compareIds)
        if (!cancelled) {
          if (res.success && res.data) setSchools(res.data.schools || [])
          else setError(res.message || 'Failed to compare')
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.status === 401 ? 'login' : 'Failed to compare')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [compareIds])

  const picker = allSchools.filter((s) => !compareIds.includes(s.schoolID))
  const feeFor = (s: ComparisonSchool) => { const r = s.gradeFees?.find((f) => f.grade === grade); return r ? Number(r.fees) : null }
  const seatsFor = (s: ComparisonSchool) => { const v = s.seatsByGrade?.[grade]; return v === undefined ? null : Number(v) }
  const fees = schools.map(feeFor).filter((f): f is number => f !== null)
  const bestFee = fees.length > 1 ? Math.min(...fees) : null
  const seats = schools.map(seatsFor).filter((v): v is number => v !== null && v > 0)
  const bestSeats = seats.length > 1 ? Math.max(...seats) : null
  const ratings = schools.map((s) => Number(s.rating?.average) || 0)
  const bestRating = Math.max(...ratings, 0)
  const sizes = schools.map((s) => Number(s.classSize) || Infinity)
  const bestSize = Math.min(...sizes)

  const Good = ({ children }: { children: React.ReactNode }) => (
    <span className="good">{children}<Check size={13} /></span>
  )
  const GradePicker = () => (
    <select className="prev-select" value={grade} onChange={(e) => chooseGrade(e.target.value)} aria-label="Grade to compare">
      <option value="">Choose a grade…</option>
      {EXACT_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
    </select>
  )
  const SchoolPicker = ({ label }: { label: string }) => (
    <select className="prev-select" value="" onChange={(e) => { const id = parseInt(e.target.value); if (id) toggleCompare(id) }} aria-label={label}>
      <option value="">{label}</option>
      {picker.map((s) => <option key={s.schoolID} value={s.schoolID}>{s.schoolName}</option>)}
    </select>
  )

  // Step 1 — grade
  if (!grade) {
    return (
      <div className="prev-c prev-stub">
        <span className="ic"><Scale size={30} /></span>
        <h2 className="prev-h2">Which grade are you comparing?</h2>
        <p className="prev-sub">Pick the grade your child will join — we&apos;ll compare fees and open seats for exactly that grade.</p>
        <div className="prev-csel"><GradePicker /></div>
      </div>
    )
  }
  // Step 2 — schools
  if (compareIds.length < 2) {
    return (
      <div className="prev-c prev-stub">
        <span className="ic"><Scale size={30} /></span>
        <h2 className="prev-h2">Now pick 2–4 schools</h2>
        <p className="prev-sub">Comparing for <b style={{ color: 'var(--teal)' }}>{grade}</b> — choose schools below.</p>
        <div className="prev-csel">
          <GradePicker />
          <SchoolPicker label={compareIds.length === 0 ? 'Choose the first school…' : 'Choose another school…'} />
          {compareIds.length === 1 && <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>1 selected — pick at least one more.</p>}
        </div>
      </div>
    )
  }

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="prev-h2" style={{ textAlign: 'left', margin: 0 }}>Compare</h2>
          <button onClick={clearCompare} style={{ background: 'none', border: 'none', color: 'var(--oranged)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Clear all</button>
        </div>
        <p className="prev-sub" style={{ textAlign: 'left', margin: '6px 0 16px' }}>
          Fees and seats shown for <b style={{ color: 'var(--teal)' }}>{grade}</b>
        </p>
        <div style={{ maxWidth: 220, marginBottom: 16 }}><GradePicker /></div>

        {loading ? (
          <div className="prev-spinner" />
        ) : error === 'login' ? (
          <div className="prev-stub" style={{ padding: '40px 0' }}>
            <h3 className="ff" style={{ fontSize: 18, fontWeight: 700 }}>Log in to compare fees</h3>
            <p className="prev-sub">Comparing fees side by side is a free member feature.</p>
            <Link href="/login?next=/preview/compare" className="btnT">Log in</Link>
          </div>
        ) : error ? (
          <div className="prev-stub" style={{ padding: '40px 0', color: 'var(--muted)', fontWeight: 600 }}>{error}</div>
        ) : (
          <>
            <div className="prev-ctable">
              <div className="prev-crow">
                <div className="prev-clabel">School</div>
                {schools.map((s) => {
                  const logo = getImageUrl(s.schoolImgURL)
                  return (
                    <div key={s.schoolID} className="prev-chead">
                      <button className="rm" onClick={() => removeCompare(s.schoolID)} aria-label={`Remove ${s.schoolName}`}><X size={14} /></button>
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt={s.schoolName} />
                      ) : (
                        <span className="mono">{initials(s.schoolName)}</span>
                      )}
                      <Link href={`/preview/schools/${s.schoolID}`} className="nm">{s.schoolName}</Link>
                    </div>
                  )
                })}
              </div>

              {[
                { k: `Fees (${grade})`, r: (s: ComparisonSchool) => { const f = feeFor(s); if (f === null) return '—'; const t = `KD ${f.toLocaleString()}`; return bestFee !== null && f === bestFee ? <Good>{t}</Good> : t } },
                { k: `Seats (${grade})`, r: (s: ComparisonSchool) => { const v = seatsFor(s); if (v === null) return '—'; if (v === 0) return <span style={{ color: 'var(--oranged)' }}>Full</span>; return bestSeats !== null && v === bestSeats ? <Good>{v}</Good> : v } },
                { k: 'Rating', r: (s: ComparisonSchool) => { const v = Number(s.rating?.average) || 0; if (!s.rating?.totalReviews) return '—'; const t = `★ ${v}`; return v === bestRating && v > 0 ? <Good>{t}</Good> : t } },
                { k: 'Class size', r: (s: ComparisonSchool) => { const n = Number(s.classSize); if (!n) return '—'; return n === bestSize ? <Good>{n}</Good> : n } },
                { k: 'Curriculum', r: (s: ComparisonSchool) => s.system || '—' },
                { k: 'Stages', r: (s: ComparisonSchool) => (
                  <span style={{ display: 'inline-flex', gap: 5, justifyContent: 'center' }}>
                    {schoolStages(s.educationalStage).map((k) => <i key={k} title={STAGE_LABEL[k]} style={{ width: 9, height: 9, borderRadius: '50%', background: STAGE_DOT[k], display: 'inline-block' }} />)}
                  </span>
                ) },
                { k: 'Reviews', r: (s: ComparisonSchool) => s.rating?.totalReviews ?? 0 },
              ].map((row) => (
                <div key={row.k} className="prev-crow">
                  <div className="prev-clabel">{row.k}</div>
                  {schools.map((s) => <div key={s.schoolID} className="prev-ccell">{row.r(s)}</div>)}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} style={{ color: 'var(--teald)' }} /> = best in row · — = not published for {grade}
            </p>
            {!maxReached && <div style={{ maxWidth: 360, marginTop: 14 }}><SchoolPicker label="Add another school (up to 4)…" /></div>}
          </>
        )}
      </div>
    </section>
  )
}
