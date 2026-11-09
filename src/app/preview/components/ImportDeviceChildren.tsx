'use client'

import { useId, useState } from 'react'
import { ImportItem } from '@/lib/childrenApi'
import { Child, GRADE_ORDER, normalizeGrade } from '../lib/cost'
import { MONTH_NAMES, joinBirth, yearLabel, yearOptions } from '../lib/children'
import '../children.css'

// "We found N children saved on this device. Add them to your account?"
// Old names are NOT imported by default: the parent types a nickname per child.

interface Props {
  device: Child[]
  /** how many more children the account can take */
  room: number
  /** resolves to a message for the parent (success or error) */
  onImport: (items: ImportItem[]) => Promise<{ ok: boolean; message: string }>
  onSnooze: () => void
}

interface Entry { nick: string; month: string; year: string }

export default function ImportDeviceChildren({ device, room, onImport, onSnooze }: Props) {
  const uid = useId()
  const list = device.slice(0, Math.max(room, 0))
  const [step, setStep] = useState<'ask' | 'form'>('ask')
  const [entries, setEntries] = useState<Entry[]>(() => device.map(() => ({ nick: '', month: '', year: '' })))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const years = yearOptions()
  const set = (i: number, patch: Partial<Entry>) => setEntries((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)))

  const n = device.length
  const intro = `We found ${new Intl.NumberFormat('en-GB').format(n)} ${n === 1 ? 'child' : 'children'} saved on this device. Add ${n === 1 ? 'it' : 'them'} to your account?`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (list.some((_, i) => !!entries[i].month !== !!entries[i].year)) { setErr('For each child, choose both month and year, or leave both empty.'); return }
    setErr(''); setBusy(true)
    const items: ImportItem[] = list.map((c, i) => {
      const en = entries[i]
      const nickname = en.nick.trim()
      const bm = joinBirth(en.year, en.month)
      const g = normalizeGrade(c.grade)
      const extras: NonNullable<ImportItem['extras']> = {}
      if (!bm && GRADE_ORDER.includes(g)) extras.gradeOverride = g // no birth month: keep the grade already chosen
      if (c.on && Object.keys(c.on).length) extras.on = c.on
      return {
        clientKey: c.id,
        ...(nickname ? { nickname } : {}),
        ...(bm ? { birthMonth: bm } : {}),
        ...(c.schoolID != null ? { targetSchoolID: c.schoolID } : {}),
        ...(Object.keys(extras).length ? { extras } : {}),
      }
    })
    const r = await onImport(items)
    setBusy(false)
    if (!r.ok) setErr(r.message)
  }

  if (room <= 0) {
    return (
      <div className="prev-card prev-ch prev-ch-import" role="note">
        <p>{intro} Your account already has the most children it can hold, so remove one first.</p>
        <div className="prev-ch-actions"><button type="button" className="prev-ch-ghost" onClick={onSnooze}>Not now</button></div>
      </div>
    )
  }

  return (
    <div className="prev-card prev-ch prev-ch-import">
      <p id={`${uid}-t`}>{intro}</p>
      {step === 'ask' ? (
        <div className="prev-ch-actions">
          <button type="button" className="btnT" onClick={() => setStep('form')}>Add to account</button>
          <button type="button" className="prev-ch-ghost" onClick={onSnooze}>Not now</button>
        </div>
      ) : (
        <form onSubmit={submit} aria-labelledby={`${uid}-t`} noValidate>
          <p className="prev-ch-hint" style={{ marginTop: 0 }}>Old names are not copied. Give each child a nickname if you like, and a birth month and year for a suggested grade. We only keep month and year.</p>
          {list.map((c, i) => (
            <fieldset key={c.id} className="prev-ch-import-kid prev-ch-field" style={{ marginBottom: 0 }}>
              <legend>{`Child ${i + 1} · ${c.grade}`}</legend>
              <label htmlFor={`${uid}-n${i}`}>Nickname <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
              <input id={`${uid}-n${i}`} name={`importNick${i}`} className="prev-input" value={entries[i].nick} maxLength={20}
                onChange={(e) => set(i, { nick: e.target.value })} placeholder="A first name or nickname…" autoComplete="off" spellCheck={false} />
              <div className="prev-ch-row2" style={{ marginTop: 10 }}>
                <div>
                  <label htmlFor={`${uid}-m${i}`}>Birth month</label>
                  <select id={`${uid}-m${i}`} name={`importMonth${i}`} className="prev-select" value={entries[i].month} onChange={(e) => set(i, { month: e.target.value })} autoComplete="off">
                    <option value="">Month…</option>
                    {MONTH_NAMES.map((m, k) => <option key={m} value={String(k + 1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-y${i}`}>Birth year</label>
                  <select id={`${uid}-y${i}`} name={`importYear${i}`} className="prev-select" value={entries[i].year} onChange={(e) => set(i, { year: e.target.value })} autoComplete="off">
                    <option value="">Year…</option>
                    {years.map((y) => <option key={y} value={y}>{yearLabel(y)}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
          ))}
          {device.length > list.length && <p className="prev-ch-hint">Your account can hold {new Intl.NumberFormat('en-GB').format(list.length)} more, so the first {new Intl.NumberFormat('en-GB').format(list.length)} are added.</p>}
          {err && <p className="prev-ch-err" role="alert">{err}</p>}
          <div className="prev-ch-actions">
            <button type="submit" className="btnT" disabled={busy}>{busy ? 'Adding…' : 'Add to account'}</button>
            <button type="button" className="prev-ch-ghost" onClick={onSnooze} disabled={busy}>Not now</button>
          </div>
        </form>
      )}
    </div>
  )
}
