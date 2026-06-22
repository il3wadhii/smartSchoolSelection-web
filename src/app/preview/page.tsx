'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { matchesGradeFilter, GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'
import PartnerMarquee from './components/PartnerMarquee'
import PrevSchoolCard from './components/PrevSchoolCard'
import {
  Map as MapIcon, Scale, Wallet, Star, ArrowUpRight, ArrowRight,
  GraduationCap, Search, Check,
} from 'lucide-react'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

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

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="prev-hero">
        <div className="prev-c grid">
          <div className="prev-rise">
            <p className="prev-eyebrow">Kuwait&apos;s school finder</p>
            <h1 className="prev-title">
              Find the{' '}
              <span className="hl">
                best school
                <svg viewBox="0 0 200 11" preserveAspectRatio="none"><path d="M3 7 Q90 1 197 6" stroke="#F4961E" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
              </span>
              <br />for your child
            </h1>
            <p className="prev-lead">
              Compare every preschool, KG and school in Kuwait — fees, curriculum, live seats and
              real parent reviews. Free for parents.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="#schools" className="btnO">Find schools <ArrowRight size={18} /></Link>
              <Link href="/preview/map" className="btnGhost"><MapIcon size={17} /> Explore the map</Link>
            </div>
            <div className="prev-herocards">
              <div className="prev-mini"><span className="ic"><Star size={18} /></span><div><small>Top rated</small><b>{totals?.reviews ?? '210'}+ reviews</b></div></div>
              <div className="prev-mini"><span className="ic" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><GraduationCap size={18} /></span><div><small>Listed &amp; verified</small><b>{totals?.schools ?? '39'}+ schools</b></div></div>
            </div>
          </div>

          <div className="prev-heroart prev-rise">
            <div className="prev-panel">
              <div className="prev-logocard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Smart School Selection" />
                <span>Smart School<i>SELECTION</i></span>
              </div>
              <svg width="100%" viewBox="0 0 300 230" aria-hidden="true">
                <rect x="16" y="26" width="180" height="110" rx="12" fill="#14705F" />
                <rect x="16" y="26" width="180" height="110" rx="12" fill="none" stroke="#7FD3BF" strokeWidth="2.5" strokeDasharray="6 7" />
                <text x="40" y="72" fill="#CFEFE6" fontFamily="Poppins" fontWeight="800" fontSize="26">A B C</text>
                <text x="50" y="108" fill="#9FE1CB" fontFamily="Poppins" fontWeight="700" fontSize="20">1  2  3</text>
                <text x="128" y="130" fill="#7FD3BF" fontFamily="Poppins" fontWeight="700" fontSize="15">+ − ×</text>
                <ellipse cx="208" cy="212" rx="80" ry="11" fill="#14705F" />
                <rect x="150" y="188" width="120" height="20" rx="4" fill="#F4961E" /><rect x="150" y="188" width="7" height="20" fill="#D77E0C" />
                <rect x="160" y="170" width="104" height="20" rx="4" fill="#ffffff" /><rect x="160" y="170" width="7" height="20" fill="#cfd8d3" />
                <rect x="155" y="152" width="112" height="20" rx="4" fill="#E24B4A" /><rect x="155" y="152" width="7" height="20" fill="#A32D2D" />
                <path d="M210 110 L252 126 L210 142 L168 126 Z" fill="#20303C" />
                <path d="M188 132 l22 8 22 -8 v9 q-22 10 -44 0 z" fill="#2b3a47" />
                <circle cx="210" cy="126" r="4" fill="#F4961E" />
                <line x1="252" y1="126" x2="252" y2="147" stroke="#F4961E" strokeWidth="2.5" /><circle cx="252" cy="149" r="4" fill="#F4961E" />
                <path d="M262 48 a12 12 0 0 1 12 12 c0 9 -12 21 -12 21 c0 0 -12 -12 -12 -21 a12 12 0 0 1 12 -12 z" fill="#F4961E" /><circle cx="262" cy="60" r="4.5" fill="#fff" />
                <path d="M40 140 a9 9 0 0 1 9 9 c0 7 -9 16 -9 16 c0 0 -9 -9 -9 -16 a9 9 0 0 1 9 -9 z" fill="#0F6E56" /><circle cx="40" cy="149" r="3.5" fill="#fff" />
                <g stroke="#F4961E" strokeWidth="3" strokeLinecap="round"><line x1="60" y1="150" x2="60" y2="162" /><line x1="54" y1="156" x2="66" y2="156" /></g>
                <path d="M250 96 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#fff" />
              </svg>
            </div>
            <div className="prev-fstat"><b>4.8</b><small>avg parent<br />rating</small></div>
          </div>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────── */}
      <section className="prev-section">
        <div className="prev-c">
          <h2 className="prev-h2">An <span className="u">easier way</span> to choose a school</h2>
          <div className="prev-grid3">
            <Link href="/preview/map" className="prev-fcard">
              <div className="prev-ficon" style={{ background: 'var(--ttint)', color: 'var(--teald)' }}><MapIcon size={24} /></div>
              <h3>Map</h3>
              <p>Explore every school on an interactive map and find what&apos;s near you.</p>
              <span className="prev-arrowc"><ArrowUpRight size={17} /></span>
            </Link>
            <Link href="/preview/compare" className="prev-fcard">
              <div className="prev-ficon" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><Scale size={24} /></div>
              <h3>Compare</h3>
              <p>Put 2–4 schools side by side and compare them grade by grade.</p>
              <span className="prev-arrowc"><ArrowUpRight size={17} /></span>
            </Link>
            <Link href="#schools" className="prev-fcard">
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
            <div className="prev-bstat" style={{ background: 'var(--orange)', color: '#3a2305' }}><b>{totals?.schools ?? 39}+</b><span>schools listed</span></div>
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
          <p className="prev-sub">{totals?.schools ?? 39}+ schools keep their fees and seats up to date with us.</p>
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
