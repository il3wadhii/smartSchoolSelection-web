'use client'

import { useEffect, useMemo, useState } from 'react'
import { readFilters, writeFilters } from './lib/urlState'
import Link from 'next/link'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import PartnerMarquee from './components/PartnerMarquee'
import PrevSchoolCard from './components/PrevSchoolCard'
import OrbitStage from './components/OrbitStage'
import { Map as MapIcon, ArrowRight, Search, Check } from 'lucide-react'

const H1_WORDS = ['Find', 'the']

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
  const [urlReady, setUrlReady] = useState(false)

  // Filters live in the URL (?q=&grade=&seats=1) so a filtered view can be shared or reloaded.
  useEffect(() => {
    const f = readFilters()
    if (f.q) setSearch(f.q)
    if (f.grade) setGrade(f.grade)
    if (f.seats) setSeatsOnly(true)
    setUrlReady(true)
  }, [])
  useEffect(() => {
    if (urlReady) writeFilters({ q: search, grade, seats: seatsOnly })
  }, [urlReady, search, grade, seatsOnly])

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


  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="prev-hero">
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

            <div className="prev-hero-search">
              <label className="prev-search" htmlFor="school-search">
                <Search size={18} aria-hidden="true" />
                <input id="school-search" name="q" type="search" className="prev-input" placeholder="School name or area, e.g. Salwa…" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" spellCheck={false} enterKeyHint="search" />
              </label>
              <div className="prev-chips">
                {GRADE_CHIPS.map((c) => (
                  <button key={c.key} type="button" className={`prev-chip ${grade === c.key ? 'on' : ''}`} aria-pressed={grade === c.key} onClick={() => setGrade(grade === c.key ? null : c.key)}>
                    {c.label}
                  </button>
                ))}
                <button type="button" className={`prev-chip ${seatsOnly ? 'on' : ''}`} aria-pressed={seatsOnly} onClick={() => setSeatsOnly((v) => !v)}>
                  <Check size={13} style={{ verticalAlign: '-2px' }} /> Seats available
                </button>
              </div>
              <div className="prev-hero-actions">
                <a href="#schools" className="btnO">Show {loading ? '' : `${filtered.length} `}schools <ArrowRight size={18} /></a>
                <Link href="/preview/map" className="btnGhost"><MapIcon size={17} /> Explore the map</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2">An <span className="u">easier way</span> to choose a school</h2>
          <div className="prev-tools">
            <Link href="/preview/map" className="prev-tool">
              <h3>Map</h3>
              <p>Every school on one map, with what is near your home or your work.</p>
            </Link>
            <Link href="/preview/compare" className="prev-tool">
              <h3>Compare</h3>
              <p>Two to four schools side by side, fees and seats grade by grade.</p>
            </Link>
            <Link href="#schools" className="prev-tool">
              <h3>Fees and seats</h3>
              <p>Real annual fees for each grade and the places open right now, kept up to date by the schools.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured schools (real data) ─────────────────── */}
      <section className="prev-section" id="schools">
        <div className="prev-c">
          <h2 className="prev-h2">Find <span className="u">your school</span></h2>
          <p className="prev-sub">Every private school in Kuwait. Use the search above to narrow the list.</p>
          {loading ? (
            <div className="prev-spinner" />
          ) : (
            <>
              <p className="prev-count">
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
            <div className="prev-bstat" style={{ background: 'var(--teald)' }}><b>100%</b><span>free for parents</span></div>
            <div className="prev-bstat" style={{ background: 'var(--teald)', gridColumn: 'span 2' }}><b>Live</b><span>seats &amp; fees, updated by the schools themselves</span></div>
          </div>
        </div>
      </section>

      {/* ── Parent reviews ───────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2">What <span className="u">parents say</span></h2>
          <div className="prev-reviews">
            <blockquote className="lead">
              <p>“{REVIEWS[0].t}”</p>
              <footer>{REVIEWS[0].n} · {REVIEWS[0].a}</footer>
            </blockquote>
            <div className="rest">
              {REVIEWS.slice(1).map((r) => (
                <blockquote key={r.n}>
                  <p>“{r.t}”</p>
                  <footer>{r.n} · {r.a}</footer>
                </blockquote>
              ))}
            </div>
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
            <div>
              <h2>Ready to find <span className="o">the right school?</span></h2>
              <p>Free for parents, kept up to date by the schools.</p>
            </div>
            <Link href="#schools" className="btnO">Browse the schools <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
