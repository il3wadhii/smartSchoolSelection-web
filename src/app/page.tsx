'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import { School } from '@/types'
import SchoolCard from '@/components/SchoolCard'
import FinderPanel from '@/components/FinderPanel'
import TrustStats from '@/components/TrustStats'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Search, Map as MapIcon, SearchX } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const toast = (title: string) => addToast({ type: 'info', title })

  const [schools, setSchools] = useState<School[]>([])
  const [totals, setTotals] = useState<{ schools: number; reviews: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [grade, setGrade] = useState<GradeFilterKey | null>(null)
  const [area, setArea] = useState('All')
  const [curriculum, setCurriculum] = useState('All')
  const [searchText, setSearchText] = useState('')

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [listRes, filtersRes] = await Promise.all([schoolsAPI.list(1, 200), schoolsAPI.filters()])
        if (cancelled) return
        if (listRes.success && listRes.data) setSchools(listRes.data.schools || [])
        else setError(listRes.message || 'Failed to load schools')
        if (filtersRes.success && filtersRes.data?.totals) setTotals(filtersRes.data.totals)
      } catch {
        if (!cancelled) setError('Unable to reach the server. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, authLoading])

  const areas = useMemo(() => Array.from(new Set(schools.map((s) => s.Area))).filter(Boolean).sort(), [schools])
  const curricula = useMemo(() => Array.from(new Set(schools.map((s) => s.system))).filter(Boolean).sort(), [schools])

  const filtered = useMemo(() => {
    let list = schools.filter((s) => {
      if (grade && !matchesGradeFilter(s['Educational Stage'], grade)) return false
      if (area !== 'All' && s.Area !== area) return false
      if (curriculum !== 'All' && s.system !== curriculum) return false
      if (searchText) {
        const q = searchText.toLowerCase()
        if (
          !s.schoolName.toLowerCase().includes(q) &&
          !s.address?.toLowerCase().includes(q) &&
          !s.Area?.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
    return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }, [schools, grade, area, curriculum, searchText])

  const scrollToResults = () =>
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (loading || authLoading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Hero */}
      <div className="bg-primary-500 text-white rounded-b-[30px] px-6 pt-8 pb-[78px]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 font-extrabold text-[15px]">
            <span className="h-[42px] w-[42px] rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Smart School Selection" width={36} height={36} className="h-9 w-9 object-contain" />
            </span>
            Smart School Selection
          </div>
          <h1 className="font-serif text-[28px] sm:text-4xl font-semibold leading-[1.2] mt-5 text-white">
            Find the <em className="not-italic font-serif italic text-orange-300">best school</em> for your children
          </h1>
          <p className="text-primary-100 text-sm sm:text-base mt-2.5 leading-relaxed">
            Compare every preschool, KG and school in Kuwait — fees, curriculum, live seats and real parent reviews.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 mt-5 bg-white text-primary-700 font-extrabold text-sm px-4 py-2.5 rounded-btn hover:bg-primary-100 transition-colors"
          >
            <MapIcon className="h-4 w-4" /> Explore schools on the map
          </Link>
        </div>
      </div>

      {/* Finder */}
      <div className="max-w-2xl mx-auto">
        <FinderPanel
          grade={grade}
          onGrade={(k) => setGrade(grade === k ? null : k)}
          area={area}
          onArea={setArea}
          curriculum={curriculum}
          onCurriculum={setCurriculum}
          areas={areas}
          curricula={curricula}
          onFind={scrollToResults}
        />
      </div>

      <TrustStats schools={totals?.schools ?? null} reviews={totals?.reviews ?? null} />

      {/* Results */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-5 sm:px-6 pt-6 scroll-mt-20">
        <div className="flex gap-2 mb-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search name, area or address…"
              className="input-field pl-9 py-2.5"
            />
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 chip"
            title="Open the map view"
          >
            <MapIcon className="h-4 w-4" /> Map
          </Link>
        </div>

        <p className="text-muted text-[13px] font-semibold mb-3">
          {filtered.length} school{filtered.length === 1 ? '' : 's'}
          {grade ? ` · ${GRADE_CHIPS.find((c) => c.key === grade)?.label}` : ''}
          {area !== 'All' ? ` · ${area}` : ''}
        </p>

        {error ? (
          <div className="card p-10 text-center text-muted font-semibold">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center px-10 py-16">
            <SearchX className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-600 font-medium">No schools match your search</p>
            <p className="text-muted text-sm mt-1">Try a different grade, area or keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((school) => (
              <SchoolCard key={school.schoolID} school={school} isAuthenticated={isAuthenticated} onToast={toast} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
