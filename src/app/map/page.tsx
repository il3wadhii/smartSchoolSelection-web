'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import { School } from '@/types'
import type { MapBounds } from '@/components/SchoolMap'
import SchoolCard from '@/components/SchoolCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Search, SlidersHorizontal, MapPin, List, Map as MapIcon, X, LocateFixed, Loader2 } from 'lucide-react'

// Leaflet touches window — load the map client-only, no SSR.
const SchoolMap = dynamic(() => import('@/components/SchoolMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-primary-100/40">
      <LoadingSpinner size="lg" />
    </div>
  ),
})

function MapPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const toast = (title: string) => addToast({ type: 'info', title })
  const router = useRouter()

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchText, setSearchText] = useState('')
  const [grade, setGrade] = useState<GradeFilterKey | null>(null)
  const [area, setArea] = useState('All')
  const [curriculum, setCurriculum] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  // Drop a "you are here" marker. We try the browser's precise GPS first (only
  // available in a secure context — https or localhost). If that's unavailable
  // or fails (macOS can't get a fix, permission off, or the site is opened over
  // http on a phone), we fall back to an approximate, city-level location from
  // the visitor's IP address so the feature still works everywhere.
  const locateByIP = async (): Promise<boolean> => {
    try {
      const res = await fetch('https://ipwho.is/')
      const data = await res.json()
      if (data && data.success !== false && typeof data.latitude === 'number') {
        setUserLocation({ lat: data.latitude, lng: data.longitude })
        toast(`Approximate location set${data.city ? ` · ${data.city}` : ''}`)
        return true
      }
    } catch {
      /* network error / blocked — handled by caller */
    }
    return false
  }

  const handleLocate = () => {
    setLocating(true)

    const fallbackToIP = async () => {
      const ok = await locateByIP()
      setLocating(false)
      if (!ok) toast('Couldn’t get your location. Please check your connection and try again')
    }

    const canUsePreciseGps =
      typeof navigator !== 'undefined' && 'geolocation' in navigator && window.isSecureContext

    if (!canUsePreciseGps) {
      // Not a secure context (e.g. phone over http) → approximate IP location.
      fallbackToIP()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        // Precise GPS failed (permission off, no WiFi fix, timeout…) — log it
        // for debugging and fall back to approximate IP-based location.
        console.warn('Geolocation failed:', err.code, err.message)
        fallbackToIP()
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    )
  }

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await schoolsAPI.list(1, 200)
        if (!cancelled) {
          if (res.success && res.data) setSchools(res.data.schools || [])
          else setError(res.message || 'Failed to load schools')
        }
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

  const areas = useMemo(
    () => Array.from(new Set(schools.map((s) => s.Area))).filter(Boolean).sort(),
    [schools]
  )
  const curricula = useMemo(
    () => Array.from(new Set(schools.map((s) => s.system))).filter(Boolean).sort(),
    [schools]
  )

  // Attribute filters (grade / area / curriculum / search) — drives the PINS
  const matched = useMemo(() => {
    return schools.filter((s) => {
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
  }, [schools, grade, area, curriculum, searchText])

  // The LIST additionally narrows to what's inside the current map viewport
  const listed = useMemo(() => {
    if (!bounds) return matched
    return matched.filter((s) => {
      const lat = s.location?.latitude
      const lng = s.location?.longitude
      if (typeof lat !== 'number' || typeof lng !== 'number') return false
      return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
    })
  }, [matched, bounds])

  const activeFilters = (grade ? 1 : 0) + (area !== 'All' ? 1 : 0) + (curriculum !== 'All' ? 1 : 0)

  if (loading || authLoading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Filter bar */}
      <div className="px-4 sm:px-6 pt-4 pb-3 bg-white border-b border-line">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search schools, areas…"
              className="input-field pl-9 py-2.5"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`relative inline-flex items-center gap-2 px-4 rounded-btn border font-medium text-sm ${
              showFilters || activeFilters ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-line text-secondary-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Grade chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto fbar">
          {GRADE_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setGrade(grade === chip.key ? null : chip.key)}
              className={`chip whitespace-nowrap ${grade === chip.key ? 'chip-on' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Area + curriculum (collapsible) */}
        {showFilters && (
          <div className="flex gap-2.5 mt-3">
            <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field flex-1">
              <option value="All">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="input-field flex-1">
              <option value="All">Any curriculum</option>
              {curricula.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button
                onClick={() => { setGrade(null); setArea('All'); setCurriculum('All') }}
                className="px-3 rounded-btn border border-line text-accent-500 text-sm font-bold inline-flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile view toggle */}
      <div className="lg:hidden flex border-b border-line bg-white">
        {(['map', 'list'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`flex-1 py-2.5 text-sm font-bold inline-flex items-center justify-center gap-1.5 ${
              mobileView === v ? 'text-primary-600 border-b-2 border-primary-500' : 'text-muted'
            }`}
          >
            {v === 'map' ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
            {v === 'map' ? 'Map' : `List (${listed.length})`}
          </button>
        ))}
      </div>

      {error ? (
        <div className="card p-10 text-center text-muted font-semibold m-6">{error}</div>
      ) : (
        <div className="flex" style={{ height: 'calc(100vh - 230px)' }}>
          {/* List pane */}
          <div
            className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[420px] shrink-0 border-r border-line bg-surface`}
          >
            <p className="px-4 pt-3 pb-1 text-[12.5px] text-muted font-bold">
              {listed.length} school{listed.length === 1 ? '' : 's'} in view
            </p>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {listed.length === 0 ? (
                <div className="text-center py-16 text-muted">
                  <MapPin className="h-9 w-9 mx-auto mb-2 text-secondary-300" />
                  <p className="font-semibold text-sm">No schools in this area</p>
                  <p className="text-[13px] mt-1">Zoom out or pan the map, or clear filters.</p>
                </div>
              ) : (
                listed.map((school) => (
                  <div
                    key={school.schoolID}
                    onMouseEnter={() => setSelectedId(school.schoolID)}
                    className={selectedId === school.schoolID ? 'ring-2 ring-primary-400 rounded-card' : ''}
                  >
                    <SchoolCard school={school} isAuthenticated={isAuthenticated} onToast={toast} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map pane */}
          <div className={`${mobileView === 'map' ? 'block' : 'hidden'} lg:block flex-1 relative`}>
            <SchoolMap
              schools={matched}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpen={(id) => router.push(`/schools/${id}`)}
              onBoundsChange={setBounds}
              userLocation={userLocation}
            />
            <button
              onClick={handleLocate}
              disabled={locating}
              title="Show my current location"
              aria-label="Show my current location"
              className="absolute bottom-5 right-5 z-[1000] inline-flex items-center gap-2 rounded-btn bg-white shadow-lg border border-line px-3.5 py-2.5 text-sm font-bold text-secondary-700 hover:bg-primary-50 disabled:opacity-70"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              ) : (
                <LocateFixed className="h-4 w-4 text-primary-600" />
              )}
              <span className="hidden sm:inline">{userLocation ? 'My location' : 'Locate me'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPageWithSuspense() {
  return (
    <Suspense fallback={<div className="py-32"><LoadingSpinner size="lg" /></div>}>
      <MapPage />
    </Suspense>
  )
}
