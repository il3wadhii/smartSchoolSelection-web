'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import PartnerMarquee from './components/PartnerMarquee'
import PrevSchoolCard from './components/PrevSchoolCard'
import OrbitStage from './components/OrbitStage'
import Skyline from './components/Skyline'
import {
  Map as MapIcon, Scale, Wallet, Star, ArrowUpRight, ArrowRight,
  GraduationCap, Search, Check, MapPin, HandCoins,
} from 'lucide-react'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// Eased count-up for the hero stats; snaps straight to the target when the
// user prefers reduced motion.
function useCountUp(target: number, ms = 1400) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

const H1_WORDS = ['The', 'smart', 'way', 'to', 'find', 'the']

const REVIEWS = [
  { n: 'Noura A.', a: 'Parent in Salmiya', t: 'I compared 6 schools and their fees in one evening. Saved me weeks of phone calls.' },
  { n: 'Wade W.', a: 'Parent in Hawally', t: 'Seeing open seats per grade was the thing — we found a KG2 spot instantly.' },
  { n: 'Jenny W.', a: 'Parent in Jabriya', t: 'Clean, friendly and actually free. The map view made location so easy.' },
]

export default function PreviewHome() {
  const [schools, setSchools] = useState<School[]>([])
  const [totals, setTotals] = useState<{ schools: number; reviews: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [list, filters] = await Promise.all([schoolsAPI.list(1, 200), schoolsAPI.filters()])
        if (cancelled) return
        if (list.success && list.data) setSchools(list.data.schools || [])
        if (filters.success && filters.data?.totals) setTotals(filters.data.totals)
      } catch {
        /* leave empty — prototype */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<GradeFilterKey | null>(null)
  const [seatsOnly, setSeatsOnly] = useState(false)

  const filtered = useMemo(
    () =>
      [...schools]
        .filter((s) => {
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
        })
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [schools, search, grade, seatsOnly]
  )

  const nSchools = useCountUp(totals?.schools ?? 39)
  const nReviews = useCountUp(totals?.reviews ?? 210)
  const nStages = useCountUp(5)
  const nFree = useCountUp(100)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="prev-hero">
        <Skyline />
        <div className="prev-c">
          <div className="prev-show home">
            <OrbitStage schools={schools} />

            <h1 className="prev-show-h1">
              {H1_WORDS.map((w, i) => (
                <span key={i} className="w" style={{ ['--i' as never]: i }}>{w}&nbsp;</span>
              ))}
              <span className="w hl" style={{ ['--i' as never]: H1_WORDS.length }}>best school</span>
              <span className="w" style={{ ['--i' as never]: H1_WORDS.length + 1 }}>&nbsp;in Kuwait</span>
            </h1>
            <p className="prev-show-sub">
              Every preschool, KG and school — fees, curricula, live seats and real parent reviews. In one place.
            </p>

            <div className="prev-show-stats">
              <div className="st" style={{ ['--i' as never]: 0 }}>
                <span className="ic"><GraduationCap size={20} /></span>
                <b>{nSchools}+</b><small>schools listed</small>
              </div>
              <div className="st" style={{ ['--i' as never]: 1 }}>
                <span className="ic" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><Star size={20} /></span>
                {totals && totals.reviews < 25 ? (
                  <><b><Check size={24} strokeWidth={3.5} style={{ verticalAlign: '-2px' }} /></b><small>real parent reviews</small></>
                ) : (
                  <><b>{nReviews}+</b><small>parent reviews</small></>
                )}
              </div>
              <div className="st" style={{ ['--i' as never]: 2 }}>
                <span className="ic"><MapPin size={20} /></span>
                <b>{nStages}</b><small>stages covered</small>
              </div>
              <div className="st" style={{ ['--i' as never]: 3 }}>
                <span className="ic" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><HandCoins size={20} /></span>
                <b>{nFree}%</b><small>free for parents</small>
              </div>
            </div>

            <div className="prev-show-cta">
              <Link href="#schools" className="btnO">Find schools <ArrowRight size={18} /></Link>
              <Link href="/preview/map" className="btnGhost"><MapIcon size={17} /> Explore the map</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2">An <span className="u">easier way</span> to choose a school</h2>
          <div className="prev-grid3">
            <Link href="/preview/map" className="prev-fcard">
              <span className="ghost" aria-hidden="true"><MapIcon size={150} /></span>
              <div className="prev-ficon" style={{ background: 'var(--ttint)', color: 'var(--teald)' }}><MapIcon size={24} /></div>
              <h3>Map</h3>
              <p>Explore every school on an interactive map and find what&apos;s near you.</p>
              <span className="prev-arrowc"><ArrowUpRight size={17} /></span>
            </Link>
            <Link href="/preview/compare" className="prev-fcard">
              <span className="ghost" aria-hidden="true"><Scale size={150} /></span>
              <div className="prev-ficon" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><Scale size={24} /></div>
              <h3>Compare</h3>
              <p>Put 2–4 schools side by side and compare them grade by grade.</p>
              <span className="prev-arrowc"><ArrowUpRight size={17} /></span>
            </Link>
            <Link href="#schools" className="prev-fcard">
              <span className="ghost" aria-hidden="true"><Wallet size={150} /></span>
              <div className="prev-ficon" style={{ background: 'var(--ttint)', color: 'var(--teald)' }}><Wallet size={24} /></div>
              <h3>Fees</h3>
              <p>See real annual fees by grade and live seat availability.</p>
              <span className="prev-arrowc"><ArrowUpRight size={17} /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured schools (real data) ─────────────────── */}
      <section className="prev-section" id="schools">
        <div className="prev-c">
          <h2 className="prev-h2">Find <span className="u">your school</span></h2>
          <p className="prev-sub">Browse every school in Kuwait — search by name or area, or filter by grade.</p>
          <div style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
            <span className="prev-search">
              <Search size={17} />
              <input className="prev-input" placeholder="Search name or area…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </span>
          </div>
          <div className="prev-chips" style={{ justifyContent: 'center' }}>
            {GRADE_CHIPS.map((c) => (
              <button key={c.key} className={`prev-chip ${grade === c.key ? 'on' : ''}`} onClick={() => setGrade(grade === c.key ? null : c.key)}>
                {c.label}
              </button>
            ))}
            <button className={`prev-chip ${seatsOnly ? 'on' : ''}`} onClick={() => setSeatsOnly((v) => !v)}>
              <Check size={13} style={{ verticalAlign: '-2px' }} /> Seats available
            </button>
          </div>
          {loading ? (
            <div className="prev-spinner" />
          ) : (
            <>
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 700, fontSize: 13, marginBottom: 18 }}>
                {filtered.length} school{filtered.length === 1 ? '' : 's'}
              </p>
              <div className="prev-sgrid">
                {filtered.map((s) => <PrevSchoolCard key={s.schoolID} s={s} />)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────── */}
      <section className="prev-section" id="about">
        <div className="prev-c">
          <h2 className="prev-h2">Why choose <span className="u">Smart School?</span></h2>
          <div className="prev-bento">
            <div className="prev-bimg">
              <svg width="100%" viewBox="0 0 260 200" aria-hidden="true" style={{ position: 'absolute', bottom: 0 }}>
                <text x="44" y="70" fill="#CFEFE6" fontFamily="Poppins" fontWeight="800" fontSize="22">123</text>
                <text x="178" y="62" fill="#9FE1CB" fontFamily="Poppins" fontWeight="800" fontSize="20">ABC</text>
                <ellipse cx="130" cy="184" rx="76" ry="10" fill="#14705F" />
                <rect x="74" y="166" width="112" height="18" rx="4" fill="#F4961E" />
                <rect x="84" y="150" width="92" height="18" rx="4" fill="#fff" />
                <rect x="79" y="134" width="102" height="18" rx="4" fill="#E24B4A" />
                <path d="M130 102 L172 118 L130 134 L88 118 Z" fill="#20303C" />
                <circle cx="130" cy="118" r="4" fill="#F4961E" />
                <line x1="172" y1="118" x2="172" y2="136" stroke="#F4961E" strokeWidth="2.5" /><circle cx="172" cy="138" r="4" fill="#F4961E" />
                <path d="M214 100 a9 9 0 0 1 9 9 c0 7 -9 16 -9 16 c0 0 -9 -9 -9 -16 a9 9 0 0 1 9 -9 z" fill="#F4961E" /><circle cx="214" cy="109" r="3.5" fill="#fff" />
              </svg>
            </div>
            <div className="prev-bstat" style={{ background: 'var(--orange)', color: '#3a2305' }}><b>{totals?.schools ?? 39}</b><span>schools listed</span></div>
            <div className="prev-bstat" style={{ background: 'var(--teal)' }}><b>100%</b><span>free for parents</span></div>
            <div className="prev-bstat" style={{ background: 'var(--teald)', gridColumn: 'span 2' }}><b>Live</b><span>seats &amp; fees, updated by the schools themselves</span></div>
          </div>
        </div>
      </section>

      {/* ── Parent reviews ───────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2"><span className="u">Parent reviews</span></h2>
          <div className="prev-grid3">
            {REVIEWS.map((r) => (
              <div key={r.n} className="prev-testi">
                <div className="prev-trow">
                  <span className="av">{initials(r.n)}</span>
                  <div><b>{r.n}</b><small>{r.a}</small></div>
                </div>
                <div className="prev-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} fill="currentColor" />)}</div>
                <p>{r.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner schools (real logos) ─────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2">Our <span className="u">partner schools</span></h2>
          <p className="prev-sub">{totals?.schools ?? 39} schools keep their fees and seats up to date with us.</p>
        </div>
        {!loading && <PartnerMarquee schools={schools} />}
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <div className="prev-cta">
            <h2>Ready to find <span className="o">the right school?</span><br />Join thousands of Kuwait parents.</h2>
            <Link href="#schools" className="btnO">Get started <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
