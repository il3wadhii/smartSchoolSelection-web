'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { School } from '@/types'
import type { MapBounds } from '@/components/SchoolMap'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import { Search, LocateFixed, Loader2, Check } from 'lucide-react'

const SchoolMap = dynamic(() => import('@/components/SchoolMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="prev-spinner" style={{ margin: 0 }} />
    </div>
  ),
})

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PreviewMap() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<GradeFilterKey | null>(null)
  const [seatsOnly, setSeatsOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [, setBounds] = useState<MapBounds | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locMsg, setLocMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await schoolsAPI.list(1, 200)
        if (!cancelled && res.success && res.data) setSchools(res.data.schools || [])
      } catch {
        /* prototype */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(
    () =>
      schools.filter((s) => {
        if (grade && !matchesGradeFilter(s['Educational Stage'], grade)) return false
        if (seatsOnly && !s.seatsPublished) return false
        if (search) {
          const q = search.toLowerCase()
          if (
            !s.schoolName.toLowerCase().includes(q) &&
            !s.Area?.toLowerCase().includes(q) &&
            !s.address?.toLowerCase().includes(q)
          )
            return false
        }
        return true
      }),
    [schools, grade, search, seatsOnly]
  )

  // Locate me: precise GPS first, then approximate IP location (works on phones
  // over http and when the OS can't return a fix).
  const flash = (m: string) => { setLocMsg(m); setTimeout(() => setLocMsg(''), 4000) }
  const locateByIP = async (): Promise<boolean> => {
    try {
      const res = await fetch('https://ipwho.is/')
      const data = await res.json()
      if (data && data.success !== false && typeof data.latitude === 'number') {
        setUserLocation({ lat: data.latitude, lng: data.longitude })
        flash(`Approximate location set${data.city ? ` · ${data.city}` : ''}`)
        return true
      }
    } catch { /* handled by caller */ }
    return false
  }
  const handleLocate = () => {
    setLocating(true)
    const fallback = async () => { const ok = await locateByIP(); setLocating(false); if (!ok) flash('Couldn’t get your location') }
    const canGps = typeof navigator !== 'undefined' && 'geolocation' in navigator && window.isSecureContext
    if (!canGps) { fallback(); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); flash('Showing your location') },
      () => { fallback() },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    )
  }

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c">
        <h2 className="prev-h2">Explore schools on the <span className="u">map</span></h2>
        <p className="prev-sub">Pan and zoom to find schools near you — tap a pin or a card for details.</p>

        <div className="prev-filterbar" style={{ display: 'flex', gap: 10 }}>
          <span className="prev-search">
            <Search size={17} />
            <input className="prev-input" placeholder="Search schools, areas…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
        </div>
        <div className="prev-chips">
          {GRADE_CHIPS.map((c) => (
            <button key={c.key} className={`prev-chip ${grade === c.key ? 'on' : ''}`} onClick={() => setGrade(grade === c.key ? null : c.key)}>
              {c.label}
            </button>
          ))}
          <button className={`prev-chip ${seatsOnly ? 'on' : ''}`} onClick={() => setSeatsOnly((v) => !v)}>
            <Check size={13} style={{ verticalAlign: '-2px' }} /> Seats available
          </button>
        </div>

        <div className="prev-maprow">
          <div className="prev-maplist">
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>{filtered.length} schools</p>
            {filtered.map((s) => {
              const logo = getImageUrl(s.schoolImgURL)
              return (
                <div
                  key={s.schoolID}
                  className={`prev-maplistcard ${selectedId === s.schoolID ? 'sel' : ''}`}
                  onMouseEnter={() => setSelectedId(s.schoolID)}
                  onClick={() => router.push(`/preview/schools/${s.schoolID}`)}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt={s.schoolName} loading="lazy" />
                  ) : (
                    <span className="mono">{initials(s.schoolName)}</span>
                  )}
                  <div>
                    <div className="nm">{s.schoolName}</div>
                    <div className="meta">{s.Area}{s.system ? ` · ${s.system}` : ''}</div>
                    {s.seatsPublished && (
                      <span className="prev-seatbadge"><Check size={11} /> Seats available</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="prev-mapwrap">
            {locMsg && <div className="prev-locmsg">{locMsg}</div>}
            {!loading && (
              <SchoolMap
                schools={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={(id) => router.push(`/preview/schools/${id}`)}
                onBoundsChange={setBounds}
                userLocation={userLocation}
              />
            )}
            <button className="btnT prev-locate" onClick={handleLocate} disabled={locating} aria-label="Show my current location">
              {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              {userLocation ? 'My location' : 'Locate me'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
