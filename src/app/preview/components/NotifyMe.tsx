'use client'

import { useId, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { ChildrenState, gradeOf, nameOf } from '../lib/children'
import { normGrade, useSeatAlerts } from '../lib/seatAlerts'
import '../children.css'

// "Notify me" for one grade row on the Fees tab. If one or more of the parent's
// children are in that grade, offer to tie the alert to a child:
//   one match  → "Notify me for: [Sara · KG2]"   several → radio list
// otherwise (or "Just the grade") it behaves exactly as before.

interface Props {
  schoolID: number
  grade: string
  seatAlerts: ReturnType<typeof useSeatAlerts>
  kids: ChildrenState
}

export default function NotifyMe({ schoolID, grade, seatAlerts, kids }: Props) {
  const uid = useId()
  const g = normGrade(grade)
  const on = !!seatAlerts.find(schoolID, grade)
  const busy = seatAlerts.busy === `${schoolID}:${grade}`
  const matches = g ? kids.children.filter((c) => gradeOf(c) === g) : []
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState('')

  if (!g) return null

  const press = () => {
    if (on || matches.length === 0) { seatAlerts.toggle(schoolID, grade); return }
    setPick(String(matches[0].childID))
    setOpen((o) => !o)
  }
  const turnOn = async (childID?: number) => {
    setOpen(false)
    await seatAlerts.toggle(schoolID, grade, childID)
  }

  return (
    <>
      <button type="button" className={`prev-notify${on ? ' on' : ''}`} aria-pressed={on} disabled={busy}
        aria-expanded={matches.length > 0 && !on ? open : undefined}
        aria-label={on ? `Stop seat alert for ${g}` : `Email me when a seat opens in ${g}`}
        onClick={press}>
        {on ? <BellRing size={14} /> : <Bell size={14} />}{on ? 'Alert on' : 'Notify me'}
      </button>

      {open && !on && matches.length > 0 && (
        <div className="prev-ch-notify" role="group" aria-labelledby={`${uid}-l`}>
          <span className="lbl" id={`${uid}-l`}>Notify me for:</span>
          {matches.length === 1 ? (
            <>
              <button type="button" className="go" disabled={busy} onClick={() => turnOn(matches[0].childID)}>
                {nameOf(matches[0], kids.children)} · {g}
              </button>
              <button type="button" disabled={busy} onClick={() => turnOn()}>Just {g}</button>
            </>
          ) : (
            <>
              {matches.map((c) => (
                <label key={c.childID} className="prev-ch-radio">
                  <input type="radio" name={`${uid}-who`} value={String(c.childID)} checked={pick === String(c.childID)} onChange={() => setPick(String(c.childID))} />
                  {nameOf(c, kids.children)} · {g}
                </label>
              ))}
              <label className="prev-ch-radio">
                <input type="radio" name={`${uid}-who`} value="" checked={pick === ''} onChange={() => setPick('')} />
                Just {g}, not for a child
              </label>
              <button type="button" className="go" disabled={busy} onClick={() => turnOn(pick ? Number(pick) : undefined)}>Notify me</button>
            </>
          )}
          <button type="button" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
    </>
  )
}
