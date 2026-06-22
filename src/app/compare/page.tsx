'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCompare } from '@/contexts/CompareContext'
import { schoolsAPI } from '@/lib/api'
import { schoolStages, EXACT_GRADES } from '@/lib/stages'
import StageLine from '@/components/StageLine'
import { SchoolLogo } from '@/components/SchoolCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Scale, X, Check } from 'lucide-react'

interface ComparisonSchool {
  schoolID: number
  schoolName: string
  area: string
  system: string
  languages: string
  coedStatus: string
  educationalStage: string
  classSize: number
  fees: number | null
  schoolImgURL?: string
  rating: { average: number | string; totalReviews: number }
  gradeFees: Array<{ grade: string; fees: number }>
  seatsByGrade: Record<string, number>
}

const GRADE_STORAGE_KEY = 'compare_grade'

export default function ComparePage() {
  const { compareIds, toggleCompare, removeCompare, clearCompare, maxReached } = useCompare()
  const [grade, setGrade] = useState<string>('')
  const [schools, setSchools] = useState<ComparisonSchool[]>([])
  const [allSchools, setAllSchools] = useState<Array<{ schoolID: number; schoolName: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Remember the chosen grade between visits
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GRADE_STORAGE_KEY)
      if (saved && EXACT_GRADES.includes(saved)) setGrade(saved)
    } catch {}
  }, [])
  const chooseGrade = (g: string) => {
    setGrade(g)
    try {
      localStorage.setItem(GRADE_STORAGE_KEY, g)
    } catch {}
  }

  // Full school list for the picker (only needed once a grade is chosen)
  useEffect(() => {
    let cancelled = false
    schoolsAPI
      .list(1, 100)
      .then((res) => {
        if (!cancelled && res.success && res.data) setAllSchools(res.data.schools || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (compareIds.length < 2) {
      setSchools([])
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await schoolsAPI.compare(compareIds)
        if (!cancelled) {
          if (response.success && response.data) {
            setSchools(response.data.schools || [])
          } else {
            setError(response.message || 'Failed to compare schools')
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.response?.status === 401
              ? 'login'
              : err.response?.data?.message || 'Failed to compare schools'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [compareIds])

  const pickerOptions = allSchools.filter((s) => !compareIds.includes(s.schoolID))

  const SchoolPicker = ({ label }: { label: string }) => (
    <select
      value=""
      onChange={(e) => {
        const id = parseInt(e.target.value)
        if (id) toggleCompare(id)
      }}
      className="input-field"
      aria-label={label}
    >
      <option value="">{label}</option>
      {pickerOptions.map((s) => (
        <option key={s.schoolID} value={s.schoolID}>
          {s.schoolName}
        </option>
      ))}
    </select>
  )

  const GradePicker = () => (
    <select
      value={grade}
      onChange={(e) => chooseGrade(e.target.value)}
      className="input-field"
      aria-label="Grade to compare"
    >
      <option value="">Choose a grade…</option>
      {EXACT_GRADES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  )

  // Grade-specific values
  const feeFor = (s: ComparisonSchool): number | null => {
    const row = s.gradeFees?.find((f) => f.grade === grade)
    return row ? Number(row.fees) : null
  }
  const seatsFor = (s: ComparisonSchool): number | null => {
    const v = s.seatsByGrade?.[grade]
    return v === undefined ? null : Number(v)
  }

  const feeValues = schools.map(feeFor).filter((f): f is number => f !== null)
  const bestFee = feeValues.length > 1 ? Math.min(...feeValues) : null
  const seatValues = schools.map(seatsFor).filter((v): v is number => v !== null && v > 0)
  const bestSeats = seatValues.length > 1 ? Math.max(...seatValues) : null
  const ratings = schools.map((s) => Number(s.rating?.average) || 0)
  const bestRating = Math.max(...ratings, 0)
  const sizes = schools.map((s) => Number(s.classSize) || Infinity)
  const bestSize = Math.min(...sizes)

  const Best = ({ children }: { children: React.ReactNode }) => (
    <span className="text-good font-extrabold inline-flex items-center gap-0.5">
      {children}
      <Check className="h-3.5 w-3.5" />
    </span>
  )

  /* ── Step 1: grade ───────────────────────────────────────────── */
  if (!grade) {
    return (
      <div className="max-w-xl mx-auto px-8 py-[60px] text-center">
        <Scale className="h-11 w-11 mx-auto text-muted" />
        <h3 className="font-serif text-lg font-semibold mt-3">Which grade are you comparing?</h3>
        <p className="text-muted text-[13.5px] font-semibold mt-2 leading-[1.55]">
          Pick the grade your child will join — we&apos;ll compare fees and open seats for exactly
          that grade.
        </p>
        <div className="max-w-sm mx-auto mt-5 text-left">
          <GradePicker />
        </div>
      </div>
    )
  }

  /* ── Step 2: schools ─────────────────────────────────────────── */
  if (compareIds.length < 2) {
    return (
      <div className="max-w-xl mx-auto px-8 py-[60px] text-center">
        <Scale className="h-11 w-11 mx-auto text-muted" />
        <h3 className="font-serif text-lg font-semibold mt-3">Now pick 2–4 schools</h3>
        <p className="text-muted text-[13.5px] font-semibold mt-2 leading-[1.55]">
          Comparing for <span className="text-primary-600 font-extrabold">{grade}</span> — choose
          schools below, or add them from search results with the + button.
        </p>
        <div className="max-w-sm mx-auto mt-5 space-y-2.5 text-left">
          <GradePicker />
          <SchoolPicker label={compareIds.length === 0 ? 'Choose the first school…' : 'Choose another school…'} />
          {compareIds.length === 1 && (
            <p className="text-[12.5px] text-muted font-semibold text-center">
              1 selected — pick at least one more to compare.
            </p>
          )}
        </div>
        <Link href="/?view=results" className="btn-cta-alt mt-5 max-w-xs mx-auto block">
          Browse schools instead
        </Link>
      </div>
    )
  }

  /* ── Table ───────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 py-6 pb-12">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-serif text-[21px] font-semibold">Compare</h2>
          <p className="text-muted text-[13px] font-semibold mt-1">
            Fees and seats shown for <span className="text-primary-600 font-extrabold">{grade}</span>
          </p>
        </div>
        <button onClick={clearCompare} className="text-[12.5px] font-extrabold text-accent-500 hover:underline">
          Clear all
        </button>
      </div>

      <div className="max-w-[220px] mt-3">
        <GradePicker />
      </div>

      {loading ? (
        <div className="py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : error === 'login' ? (
        <div className="card p-10 text-center mt-4">
          <p className="font-serif text-lg font-semibold">Log in to compare</p>
          <p className="text-muted text-[13.5px] font-semibold mt-2">
            Comparing fees side by side is a member feature — accounts are free.
          </p>
          <div className="flex justify-center gap-3 mt-5">
            <Link href="/login?next=/compare" className="btn-cta max-w-[160px]">Log in</Link>
            <Link href="/signup" className="btn-cta-alt max-w-[160px]">Sign up free</Link>
          </div>
        </div>
      ) : error ? (
        <div className="card p-10 text-center text-muted font-semibold mt-4">{error}</div>
      ) : (
        <>
          <div className="card overflow-hidden mt-4">
            {/* Header row */}
            <div className="flex">
              <div className="flex-[0_0_96px] px-2.5 py-3.5 bg-[#FAFBFC]">
                <div className="text-[10.5px] text-muted font-extrabold uppercase tracking-[.04em] h-full flex items-center">
                  School
                </div>
              </div>
              {schools.map((s) => (
                <div key={s.schoolID} className="flex-1 border-l border-line px-2 py-3.5 text-center relative">
                  <button
                    onClick={() => removeCompare(s.schoolID)}
                    aria-label={`Remove ${s.schoolName}`}
                    className="absolute top-1.5 right-1.5 text-muted hover:text-accent-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="inline-flex">
                    <SchoolLogo school={s} size={38} radius={12} fontSize={12} />
                  </div>
                  <Link
                    href={`/schools/${s.schoolID}`}
                    className="block font-serif font-semibold text-xs leading-[1.25] mt-1.5 hover:text-primary-600"
                  >
                    {s.schoolName}
                  </Link>
                </div>
              ))}
            </div>

            {[
              {
                k: `Fees (${grade})`,
                render: (s: ComparisonSchool) => {
                  const f = feeFor(s)
                  if (f === null) return '—'
                  const txt = `KD ${f.toLocaleString()}`
                  return bestFee !== null && f === bestFee ? <Best>{txt}</Best> : txt
                },
              },
              {
                k: `Seats (${grade})`,
                render: (s: ComparisonSchool) => {
                  const v = seatsFor(s)
                  if (v === null) return '—'
                  if (v === 0) return <span className="text-accent-500">Full</span>
                  return bestSeats !== null && v === bestSeats ? <Best>{v}</Best> : v
                },
              },
              {
                k: 'Rating',
                render: (s: ComparisonSchool) => {
                  const r = Number(s.rating?.average) || 0
                  if (s.rating?.totalReviews === 0) return '—'
                  const txt = `★ ${r}`
                  return r === bestRating && r > 0 ? <Best>{txt}</Best> : txt
                },
              },
              {
                k: 'Class size',
                render: (s: ComparisonSchool) => {
                  const n = Number(s.classSize)
                  if (!n) return '—'
                  return n === bestSize ? <Best>{n}</Best> : n
                },
              },
              { k: 'Curriculum', render: (s: ComparisonSchool) => s.system || '—' },
              {
                k: 'Stages',
                render: (s: ComparisonSchool) => (
                  <div className="px-1">
                    <StageLine stages={schoolStages(s.educationalStage)} size="sm" />
                  </div>
                ),
              },
              { k: 'Reviews', render: (s: ComparisonSchool) => s.rating?.totalReviews ?? 0 },
            ].map((row) => (
              <div key={row.k} className="flex border-t border-line">
                <div className="flex-[0_0_96px] px-2.5 py-3 bg-[#FAFBFC]">
                  <div className="text-[10.5px] text-muted font-extrabold uppercase tracking-[.04em] h-full flex items-center">
                    {row.k}
                  </div>
                </div>
                {schools.map((s) => (
                  <div key={s.schoolID} className="flex-1 border-l border-line px-2 py-3 text-center">
                    <div className="font-extrabold text-[13px]">{row.render(s)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-muted font-semibold mt-2.5 px-1.5 inline-flex items-center gap-1">
            <Check className="h-3 w-3 text-good" /> = best value in row · — = not published for {grade}
          </p>
          {!maxReached && (
            <div className="max-w-sm mt-4">
              <SchoolPicker label="Add another school (up to 4)…" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
