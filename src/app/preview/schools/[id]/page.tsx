'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { schoolsAPI, getImageUrl } from '@/lib/api'
import { SchoolDetails } from '@/types'
import { schoolStages, STAGE_LABEL, StageKey, feesByStageGroups, stageGradeGroups } from '@/lib/stages'
import SaveHeart from '../../components/SaveHeart'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, MapPin, Phone, Scale, Lock, ChevronDown } from 'lucide-react'

const STAGE_DOT: Record<StageKey, string> = {
  nur: '#F4961E', kg: '#5DCAA5', pri: '#1F8A78', int: '#3E7CB1', high: '#155E51',
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PreviewSchoolDetail() {
  const params = useParams()
  const id = Number(params?.id)
  const { isAuthenticated } = useAuth()
  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await schoolsAPI.detail(id)
        if (!cancelled && res.success && res.data) setSchool(res.data)
      } catch {
        /* prototype */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const feeGroups = useMemo(() => feesByStageGroups(school?.gradeFees), [school])
  const feeFrom = feeGroups.length ? Math.min(...feeGroups.map((g) => g.from)) : null
  const openSeats = useMemo(() => {
    if (!school?.availability?.length) return school?.totalAvailableSeats ?? null
    return school.availability.reduce((sum, a) => sum + (Number(a.availableSpots) || 0), 0)
  }, [school])
  const stageGroups = useMemo(() => stageGradeGroups(school?.gradeFees, school?.availability), [school])
  const [open, setOpen] = useState<Record<string, boolean>>({})

  if (loading) {
    return <div className="prev-c"><div className="prev-spinner" /></div>
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
  const rating = school.rating?.average
  const reviews = school.rating?.totalReviews ?? 0

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c">
        <Link href="/preview#schools" className="prev-back"><ArrowLeft size={16} /> Back to schools</Link>

        <div className="prev-dhead">
          <SaveHeart id={school.schoolID} />
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dlogo" src={logo} alt={school.schoolName} />
          ) : (
            <span className="dmono">{initials(school.schoolName)}</span>
          )}
          <div>
            <h1>{school.schoolName}</h1>
            <div className="dmeta"><MapPin size={15} /> {school.Area}{school.system ? ` · ${school.system}` : ''}</div>
            {stages.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                {stages.map((k) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
                    <i style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_DOT[k], display: 'inline-block' }} />{STAGE_LABEL[k]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="prev-facts">
          <div className="prev-fact"><b>{rating && reviews > 0 ? Number(rating).toFixed(1) : '—'}</b><span>{reviews} reviews</span></div>
          <div className="prev-fact"><b>{feeFrom !== null ? `KD ${feeFrom.toLocaleString()}` : <span className="lock">Free account</span>}</b><span>fees from</span></div>
          <div className="prev-fact"><b>{openSeats !== null && openSeats !== undefined ? openSeats : <span className="lock">Free account</span>}</b><span>open seats</span></div>
          <div className="prev-fact"><b>{school['Number of Student in class'] || '—'}</b><span>class size</span></div>
        </div>

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
          <>
            <h3 className="ff" style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 12px' }}>Fees &amp; available seats by stage</h3>
            <div className="prev-acc">
              {stageGroups.map((g) => {
                const isOpen = !!open[g.key]
                return (
                  <div key={g.key} className="prev-accitem">
                    <button
                      className="prev-acchead"
                      aria-expanded={isOpen}
                      onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                    >
                      <span className="prev-acctitle">
                        {g.label}
                        <span className="prev-accsub">{g.rows.length} grade{g.rows.length === 1 ? '' : 's'}</span>
                      </span>
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
                            <span className="s">
                              {r.seats === null ? '—' : r.seats > 0 ? <span className="ok">{r.seats} open</span> : <span className="full">Full</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : isAuthenticated ? (
          <div className="prev-feerow" style={{ justifyContent: 'center', color: 'var(--muted)', fontWeight: 600 }}>
            No fees or seats published for this school yet.
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          {school.phone && <a href={`tel:${school.phone}`} className="btnO" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }}><Phone size={17} /> Call school</a>}
          <Link href="/preview/compare" className="btnGhost" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }}><Scale size={17} /> Compare</Link>
        </div>
      </div>
    </section>
  )
}
