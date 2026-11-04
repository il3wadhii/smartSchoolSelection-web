'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSaved } from '@/contexts/SavedContext'
import { schoolsAPI } from '@/lib/api'
import { School } from '@/types'
import PrevSchoolCard from '../components/PrevSchoolCard'
import { Heart, Bell, BellRing } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSeatAlerts } from '../lib/seatAlerts'

export default function PreviewSaved() {
  const { savedIds } = useSaved()
  const { isAuthenticated } = useAuth()
  const seat = useSeatAlerts(isAuthenticated)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

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

  const saved = useMemo(() => schools.filter((s) => savedIds.includes(s.schoolID)), [schools, savedIds])

  if (loading) {
    return <div className="prev-c"><div className="prev-spinner" /></div>
  }

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c">
        <h2 className="prev-h2">Your <span className="u">shortlist</span></h2>
        {saved.length === 0 ? (
          <div className="prev-stub">
            <span className="ic"><Heart size={30} /></span>
            <h3 className="ff" style={{ fontSize: 18, fontWeight: 700 }}>Nothing saved yet</h3>
            <p className="prev-sub">Tap the heart on any school to build your shortlist.</p>
            <Link href="/preview#schools" className="btnT">Browse schools</Link>
          </div>
        ) : (
          <>
            <p className="prev-sub" style={{ marginBottom: 22 }}>{saved.length} school{saved.length === 1 ? '' : 's'} saved</p>
            <div className="prev-sgrid">
              {saved.map((s) => <PrevSchoolCard key={s.schoolID} s={s} />)}
            </div>
          </>
        )}

        {isAuthenticated && <SeatAlertList seat={seat} />}
      </div>
    </section>
  )
}

const fmtDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

function SeatAlertList({ seat }: { seat: ReturnType<typeof useSeatAlerts> }) {
  const { alerts, remove, toggle, busy } = seat
  return (
    <div className="prev-alerts">
      <h3>Seat alerts</h3>
      <p>We email you once when a seat opens in a grade you&apos;re watching.</p>
      {alerts.length === 0 ? (
        <div className="prev-card" style={{ color: 'var(--muted)', fontSize: 15 }}>
          No alerts yet. On a school&apos;s <b style={{ color: 'var(--ink)' }}>Fees</b> tab, choose <b style={{ color: 'var(--ink)' }}>Notify me</b> next to a full grade.
        </div>
      ) : alerts.map((a) => (
        <div key={a.alertID} className={`prev-card prev-alert${a.isActive ? '' : ' done'}`}>
          <span className="ic" aria-hidden="true">{a.isActive ? <Bell size={18} /> : <BellRing size={18} />}</span>
          <div className="tx">
            <Link href={`/preview/schools/${a.schoolID}?tab=fees`}>{a.schoolName} · {a.grade}</Link>
            <small>
              {a.isActive
                ? (a.availableSpots && a.availableSpots > 0 ? `${a.availableSpots} open now` : 'Watching. No open seats yet.')
                : `Seat opened${a.notifiedOn ? `, emailed ${fmtDay.format(new Date(a.notifiedOn))}` : ''}${a.availableSpots != null ? ` · ${a.availableSpots} open now` : ''}`}
            </small>
          </div>
          <div className="act">
            {!a.isActive && (
              <button type="button" className="again" disabled={!!busy} onClick={() => toggle(a.schoolID, a.grade)}>Watch Again</button>
            )}
            <button type="button" disabled={busy === `id:${a.alertID}`} onClick={() => remove(a.alertID)} aria-label={`Remove alert for ${a.schoolName} ${a.grade}`}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  )
}
