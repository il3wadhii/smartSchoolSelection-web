'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { SchoolDetails, Rating } from '@/types'
import { schoolStages, STAGE_LABEL, StageKey, stageGradeGroups } from '@/lib/stages'
import SaveHeart from '../../components/SaveHeart'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, MapPin, Phone, Globe, Scale, Lock, ChevronDown, Star } from 'lucide-react'

const SchoolMap = dynamic(() => import('@/components/SchoolMap'), {
  ssr: false,
  loading: () => <div className="prev-mapwrap" style={{ background: 'var(--ttint)' }} />,
})

const STAGE_DOT: Record<StageKey, string> = {
  nur: '#F4961E', kg: '#5DCAA5', pri: '#1F8A78', int: '#3E7CB1', high: '#155E51',
}

type TabKey = 'info' | 'location' | 'fees' | 'reviews'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'location', label: 'Location' },
  { key: 'fees', label: 'Fees' },
  { key: 'reviews', label: 'Reviews' },
]

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Stars({ value, empty = '#E3E1D6' }: { value: number; empty?: string }) {
  const v = Math.round(value)
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={15} fill={i <= v ? '#F4961E' : 'transparent'} color={i <= v ? '#F4961E' : empty} strokeWidth={2} />
      ))}
    </span>
  )
}

export default function PreviewSchoolDetail() {
  const params = useParams()
  const id = Number(params?.id)
  const { isAuthenticated } = useAuth()
  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [reviews, setReviews] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('info')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [detailRes, ratingsRes] = await Promise.all([
          schoolsAPI.detail(id),
          schoolsAPI.ratings(id).catch(() => null),
        ])
        if (cancelled) return
        if (detailRes.success && detailRes.data) setSchool(detailRes.data)
        if (ratingsRes?.success && ratingsRes.data) setReviews(ratingsRes.data.reviews || [])
      } catch {
        /* prototype */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const stageGroups = useMemo(() => stageGradeGroups(school?.gradeFees, school?.availability), [school])

  if (loading) {
    return <div className="prev-c" style={{ paddingTop: 30 }}><div className="prev-spinner" /></div>
  }
  if (!school) {
    return (
      <div className="prev-c prev-stub">
        <h2 className="prev-h2">School not found</h2>
        <Link href="/preview#schools" className="btnT" style={{ marginTop: 16 }}>Back to schools</Link>
      </div>
    )
  }

  const logo = getImageUrl(school.schoolImgURL)
  const stages = schoolStages(school['Educational Stage'])
  const ratingNum = Number(school.rating?.average) || 0
  const reviewCount = school.rating?.totalReviews ?? reviews.length
  const url = school.URL
  const phone = school.phone
  const lat = (school as any).latitude ?? school.location?.latitude
  const lng = (school as any).longitude ?? school.location?.longitude
  const hasCoords = typeof lat === 'number' && typeof lng === 'number'
  const mapSchools = hasCoords ? [{ ...school, location: { latitude: lat, longitude: lng } } as any] : []

  return (
    <section className="prev-section" style={{ paddingTop: 22 }}>
      <div className="prev-c">
        {/* Hero */}
        <div className="prev-dhero">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="bg" src={logo} alt={school.schoolName} />
          )}
          <span className="scrim" />
          <Link href="/preview#schools" className="prev-dback" aria-label="Back to schools"><ArrowLeft size={18} /></Link>
          <span className="prev-dsave"><SaveHeart id={school.schoolID} /></span>
          <div className="inner">
            <h1>{school.schoolName}</h1>
            <div className="area"><MapPin size={15} /> {school.Area}{school.system ? ` · ${school.system}` : ''}</div>
            <div className="rate">
              <Stars value={ratingNum} empty="rgba(255,255,255,.5)" />
              <span>{reviewCount > 0 ? `${ratingNum.toFixed(1)} (${reviewCount} review${reviewCount === 1 ? '' : 's'})` : 'No reviews yet'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="prev-dactions">
          {phone && <a href={`tel:${phone}`} className="prev-dbtn t"><Phone size={17} /> Call</a>}
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="prev-dbtn n"><Globe size={17} /> Website</a>}
          <Link href="/preview/compare" className="prev-dbtn o"><Scale size={17} /> Compare</Link>
        </div>

        {/* Stage chips (brand signature) */}
        {stages.length > 0 && (
          <div className="prev-dstages">
            {stages.map((k) => (
              <span key={k}><i style={{ background: STAGE_DOT[k] }} />{STAGE_LABEL[k]}</span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="prev-dtabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`prev-dtab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── INFO ── */}
        {tab === 'info' && (
          <>
            <div className="prev-card prev-about">
              <h3>About</h3>
              <p>{school.about?.trim() || 'No description available for this school yet.'}</p>
            </div>
            <div className="prev-card">
              <h3>Key Information</h3>
              <div className="prev-kv"><span className="k">Educational Stage</span><span className="v">{school['Educational Stage'] || '—'}</span></div>
              <div className="prev-kv"><span className="k">Curriculum</span><span className="v">{school.system || '—'}</span></div>
              <div className="prev-kv"><span className="k">Languages</span><span className="v">{school.languages || '—'}</span></div>
              <div className="prev-kv"><span className="k">Co-ed Status</span><span className="v">{school.coedStatus || '—'}</span></div>
              <div className="prev-kv"><span className="k">Class Size</span><span className="v">{school['Number of Student in class'] ? `${school['Number of Student in class']} students` : '—'}</span></div>
            </div>
            <div className="prev-card prev-contact">
              <h3>Contact Information</h3>
              <div className="row"><div className="lbl">Address</div><div className="val">{school.address || '—'}</div></div>
              <div className="row"><div className="lbl">Phone</div>{phone ? <a className="val link" href={`tel:${phone}`}>{phone}</a> : <div className="val">—</div>}</div>
              <div className="row"><div className="lbl">Website</div>{url ? <a className="val link" href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <div className="val">—</div>}</div>
            </div>
          </>
        )}

        {/* ── LOCATION ── */}
        {tab === 'location' && (
          hasCoords ? (
            <div className="prev-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="prev-mapwrap"><SchoolMap schools={mapSchools} selectedId={school.schoolID} onSelect={() => {}} onOpen={() => {}} onBoundsChange={() => {}} userLocation={null} /></div>
              <div className="prev-kv" style={{ padding: '14px 18px' }}><span className="k">Address</span><span className="v">{school.address || '—'}</span></div>
            </div>
          ) : (
            <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>Location not available for this school.</div>
          )
        )}

        {/* ── FEES ── */}
        {tab === 'fees' && (
          <>
            {!isAuthenticated && (
              <div className="prev-note">
                <span className="prev-note-ic"><Lock size={18} /></span>
                <div className="prev-note-txt">
                  <b>Sign in to see fees &amp; available seats</b>
                  <p>Annual fees by grade and live open seats are free for parents — just create an account.</p>
                </div>
                <Link href={`/preview/login?next=/preview/schools/${school.schoolID}`} className="btnT">Sign in</Link>
              </div>
            )}

            {stageGroups.length > 0 ? (
              <div className="prev-acc">
                {stageGroups.map((g) => {
                  const isOpen = !!open[g.key]
                  return (
                    <div key={g.key} className="prev-accitem">
                      <button className="prev-acchead" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}>
                        <span className="prev-acctitle">{g.label}<span className="prev-accsub">{g.rows.length} grade{g.rows.length === 1 ? '' : 's'}</span></span>
                        <span className="prev-accright">
                          {g.feeFrom !== null && <span>from KD {g.feeFrom.toLocaleString()}</span>}
                          {g.seatsTotal !== null && <span className="seats">{g.seatsTotal} seats</span>}
                          <ChevronDown size={18} className={isOpen ? 'rot' : ''} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="prev-accbody">
                          <div className="prev-gradehead"><span>Grade</span><span>Fees</span><span>Open seats</span></div>
                          {g.rows.map((r) => (
                            <div key={r.grade} className="prev-graderow">
                              <span className="g">{r.grade}</span>
                              <span className="f">{r.fees !== null ? `KD ${r.fees.toLocaleString()}` : '—'}</span>
                              <span className="s">{r.seats === null ? '—' : r.seats > 0 ? <span className="ok">{r.seats} open</span> : <span className="full">Full</span>}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : isAuthenticated ? (
              <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>No fees or seats published for this school yet.</div>
            ) : null}
          </>
        )}

        {/* ── REVIEWS ── */}
        {tab === 'reviews' && (
          <>
            <div className="prev-card prev-revsum">
              <div className="big">{reviewCount > 0 ? ratingNum.toFixed(1) : '—'}</div>
              <div>
                <Stars value={ratingNum} />
                <div className="cnt">{reviewCount} review{reviewCount === 1 ? '' : 's'}</div>
              </div>
            </div>
            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <div key={r.ratingID ?? i} className="prev-card prev-revitem">
                  <div className="top">
                    <span className="who">{r.userName || 'Parent'}</span>
                    <Stars value={Number(r.rating) || 0} />
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  {r.createdOn && <span className="date">{new Date(r.createdOn).toLocaleDateString()}</span>}
                </div>
              ))
            ) : (
              <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>No reviews yet — be the first to review this school.</div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
