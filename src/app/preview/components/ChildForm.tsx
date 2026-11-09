'use client'

import { useId, useState } from 'react'
import { ChildPayload, ServerChild } from '@/lib/childrenApi'
import { GRADE_ORDER } from '../lib/cost'
import { MONTH_NAMES, joinBirth, splitBirth, yearLabel, yearOptions } from '../lib/children'
import '../children.css'

// Add / edit one child: optional nickname, birth month + year, suggested grade
// (from the API) and the parent's own grade choice. Nothing here goes in a URL.

interface Props {
  child: ServerChild | null // null = new child
  academicYear: string
  gradeRuleConfirmed: boolean
  /** resolves to an error message, or null when saved */
  onSave: (payload: ChildPayload) => Promise<string | null>
  onCancel: () => void
}

export default function ChildForm({ child, academicYear, gradeRuleConfirmed, onSave, onCancel }: Props) {
  const uid = useId()
  const isNew = child === null
  const init = splitBirth(child?.birthMonth ?? null)
  const [nick, setNick] = useState(child?.nickname ?? '')
  const [month, setMonth] = useState(init.month)
  const [year, setYear] = useState(init.year)
  const [override, setOverride] = useState<string | null>(child?.extras?.gradeOverride || null)
  const [pickOpen, setPickOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const bm = joinBirth(year, month)
  // the API computes the suggestion; only trust it while the birth month is the saved one
  const suggested = child && bm && bm === child.birthMonth ? child.suggestedGrade : null
  const ids = { nick: `${uid}-nick`, month: `${uid}-month`, year: `${uid}-year` }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!!month !== !!year) { setErr('Choose both the month and the year, or leave both empty.'); return }
    setErr('')
    const nickname = nick.trim()
    const extras = { ...(child?.extras || {}) }
    if (override) extras.gradeOverride = override
    else delete extras.gradeOverride
    const payload: ChildPayload = isNew
      ? {
          ...(nickname ? { nickname } : {}),
          ...(bm ? { birthMonth: bm } : {}),
          ...(Object.keys(extras).length ? { extras } : {}),
        }
      : { nickname: nickname || null, birthMonth: bm, extras }
    setBusy(true)
    const msg = await onSave(payload)
    setBusy(false)
    if (msg) setErr(msg)
  }

  return (
    <form className="prev-card prev-ch" onSubmit={submit} aria-labelledby={`${uid}-h`} noValidate>
      <h2 className="prev-ch-h" id={`${uid}-h`}>{isNew ? 'Add a child' : 'Edit child'}</h2>

      <div className="prev-ch-field">
        <label htmlFor={ids.nick}>Nickname <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
        <input id={ids.nick} name="childNickname" className="prev-input" value={nick} maxLength={20}
          onChange={(e) => setNick(e.target.value)} placeholder="e.g. Sara…" autoComplete="off" spellCheck={false} aria-describedby={`${ids.nick}-h`} />
        <p className="prev-ch-hint" id={`${ids.nick}-h`}>A first name or nickname is enough. No surname.</p>
      </div>

      <fieldset className="prev-ch-field">
        <legend>Birth month and year</legend>
        <div className="prev-ch-row2">
          <div>
            <label htmlFor={ids.month} className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Birth month</label>
            <select id={ids.month} name="birthMonth" className="prev-select" value={month} onChange={(e) => setMonth(e.target.value)} autoComplete="off" aria-describedby={`${uid}-bh`}>
              <option value="">Month…</option>
              {MONTH_NAMES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={ids.year} className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Birth year</label>
            <select id={ids.year} name="birthYear" className="prev-select" value={year} onChange={(e) => setYear(e.target.value)} autoComplete="off" aria-describedby={`${uid}-bh`}>
              <option value="">Year…</option>
              {yearOptions(year).map((y) => <option key={y} value={y}>{yearLabel(y)}</option>)}
            </select>
          </div>
        </div>
        <p className="prev-ch-hint" id={`${uid}-bh`}>We only keep month and year.</p>
      </fieldset>

      <div className="prev-ch-field" aria-live="polite">
        <div className="prev-ch-sug">
          <span>
            {override
              ? <>Your choice: <b>{override}</b> for {academicYear || 'next year'}</>
              : suggested
                ? <>Suggested: <b>{suggested}</b> for {academicYear || 'next year'}{!gradeRuleConfirmed && <> <span className="prev-est">estimate</span></>}</>
                : bm
                  ? <>We&apos;ll suggest a grade when you save.</>
                  : <>Add a birth month and year for a suggested grade, or choose one yourself.</>}
          </span>
          <button type="button" className="prev-ch-ghost" aria-expanded={pickOpen} aria-controls={`${uid}-grades`} onClick={() => setPickOpen((o) => !o)}>Change</button>
        </div>
        {(suggested || override) && (
          <p className="prev-ch-sug-note">
            Based on the Ministry cut-off date. Confirm with the school.{!gradeRuleConfirmed && !override && ' This grade is an estimate.'}
          </p>
        )}
        {pickOpen && (
          <div id={`${uid}-grades`}>
            <p className="prev-ch-chips-label" id={`${uid}-gl`}>Your choice</p>
            <div className="prev-ch-chips" role="group" aria-labelledby={`${uid}-gl`}>
              {GRADE_ORDER.map((g) => (
                <button key={g} type="button" className={`prev-chip sm${g === override ? ' on' : ''}`} aria-pressed={g === override}
                  onClick={() => setOverride(g === override ? null : g)}>{g}</button>
              ))}
            </div>
            {override && <div className="prev-ch-actions" style={{ marginTop: 10 }}><button type="button" className="prev-ch-ghost" onClick={() => setOverride(null)}>Use the suggestion</button></div>}
          </div>
        )}
      </div>

      {err && <p className="prev-ch-err" role="alert">{err}</p>}

      <div className="prev-ch-actions">
        <button type="submit" className="btnT" disabled={busy}>{busy ? 'Saving…' : 'Save child'}</button>
        <button type="button" className="prev-ch-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
      <p className="prev-ch-consent">Stored on your account: nickname, birth month and year, grade. Delete any time.</p>
    </form>
  )
}
