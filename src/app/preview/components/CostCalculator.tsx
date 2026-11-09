'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { SchoolCostInfo, costFor, feeKey, gradesOf, normalizeGrade, num } from '../lib/cost'
import { ChildrenState, gradeOf, isOverride, nameOf } from '../lib/children'
import { readParam, writeParam } from '../lib/urlState'
import '../children.css'

// "What it really costs" — bottom of the school's Fees tab. Tuition for one
// grade + the school's extra lines → true cost per year, first year, per month.
// A "Child" select pre-fills the grade from the parent's profile (?kid=<id>).

export function FeeSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`prev-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

export default function CostCalculator({ info, kids }: { info: SchoolCostInfo; kids: ChildrenState }) {
  const router = useRouter()
  const uid = useId()
  const grades = useMemo(() => gradesOf(info), [info])
  const [sel, setSel] = useState<string>('other') // childID, or 'other' = Another grade
  const [pick, setPick] = useState<string | null>(null) // grade chosen here, overrides the profile for this calculation
  const [on, setOn] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [started, setStarted] = useState(false)

  // choose the first child (or ?kid=) once the list has loaded
  useEffect(() => {
    if (started || !kids.loaded) return
    setStarted(true)
    if (!kids.children.length) return
    const want = readParam('kid')
    const found = kids.children.find((c) => String(c.childID) === want) || kids.children[0]
    setSel(String(found.childID))
  }, [kids.loaded, kids.children, started])

  const selected = kids.children.find((c) => String(c.childID) === sel) || null

  // optional charges: start from what this child already switched on at this school
  useEffect(() => {
    setOn(selected && selected.targetSchoolID === info.schoolID && selected.extras?.on ? { ...selected.extras.on } : {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, info.schoolID])

  if (!grades.length) return null

  const choose = (v: string) => { setSel(v); setPick(null); setErr(''); writeParam('kid', v === 'other' ? null : v) }

  const profileGrade = selected ? gradeOf(selected) : null
  const grade = pick ?? (selected ? profileGrade : grades[0]) // null → child has no grade yet
  const published = grade != null && grades.includes(normalizeGrade(grade))
  const c = published && grade ? costFor(info, normalizeGrade(grade), on, false) : null
  const name = selected ? nameOf(selected, kids.children) : ''
  const full = kids.children.length >= kids.maxChildren

  const save = async () => {
    if (!grade || !published || busy) return
    setBusy(true); setErr('')
    const r = selected
      ? await kids.update(selected.childID, {
          targetSchoolID: info.schoolID,
          extras: { ...(selected.extras || {}), on, ...(pick ? { gradeOverride: pick } : {}) },
        })
      : await kids.create({ targetSchoolID: info.schoolID, extras: { gradeOverride: normalizeGrade(grade), on } })
    setBusy(false)
    if (!r.ok) { setErr(r.message); return }
    router.push('/preview/family')
  }

  return (
    <div className="prev-card prev-cost prev-ch prev-ch-calc" aria-labelledby={`${uid}-t`}>
      <h3 id={`${uid}-t`}>What it really costs</h3>
      <p className="prev-cost-lead">Tuition plus the school&apos;s other charges, for one child.</p>

      <div className="prev-ch-calc" style={{ marginBottom: 14 }}>
        <label htmlFor={`${uid}-child`}>Child</label>
        <select id={`${uid}-child`} name="calcChild" className="prev-select" value={sel} onChange={(e) => choose(e.target.value)} autoComplete="off">
          {kids.children.map((k) => <option key={k.childID} value={String(k.childID)}>{nameOf(k, kids.children)}</option>)}
          <option value="other">Another grade</option>
        </select>
        {selected && profileGrade && pick === null && (
          <p className="prev-ch-from">
            Grade from {name}&apos;s profile{!kids.gradeRuleConfirmed && !isOverride(selected) && <> <span className="prev-est">estimate</span></>}
          </p>
        )}
        {kids.loaded && kids.children.length === 0 && (
          <p className="prev-ch-from"><Link href="/preview/family?child=new">Add a child to pre-fill</Link> the grade from a birth month.</p>
        )}
        {selected && !profileGrade && (
          <p className="prev-ch-from">{name} has no grade yet. <Link href={`/preview/family?child=${selected.childID}`}>Add a birth month or choose a grade</Link>, or pick one below.</p>
        )}
      </div>

      <div className="prev-cost-label" id={`${uid}-gl`}>Grade</div>
      <div className="prev-cost-grades prev-ch-chips" role="group" aria-labelledby={`${uid}-gl`} style={{ marginTop: 0 }}>
        {grades.map((g) => (
          <button key={g} type="button" className={`prev-chip sm${g === (grade ? normalizeGrade(grade) : '') ? ' on' : ''}`} aria-pressed={g === (grade ? normalizeGrade(grade) : '')} onClick={() => setPick(g)}>{g}</button>
        ))}
      </div>

      {grade && !published && (
        <p className="prev-ch-unpub" role="status">This school has not published fees for {normalizeGrade(grade)}. Choose another grade to see a price.</p>
      )}

      {c && grade && (
        <>
          <div className="prev-cost-lines">
            <div className="prev-cost-line"><span className="l">Tuition · {normalizeGrade(grade)}</span><span className="v">{num(c.tuition)}</span></div>
            {c.lines.map((x) => (
              <div key={feeKey(x)} className={`prev-cost-line${x.active ? '' : ' off'}`}>
                <span className="l">
                  {x.optional && <FeeSwitch checked={x.active} label={x.label} onChange={(v) => setOn((o) => ({ ...o, [feeKey(x)]: v }))} />}
                  {x.label}
                  <small>{x.frequency === 'one_time' ? 'one-time, first year' : x.optional ? 'optional · yearly' : 'yearly'}</small>
                </span>
                <span className="v">{num(x.amount)}</span>
              </div>
            ))}
            {!c.hasExtras && <p className="prev-cost-none">This school hasn&apos;t listed its other charges yet (books, uniform, bus, registration), so this is tuition only.</p>}
          </div>

          <div className="prev-cost-total">
            <div>
              <b>{c.hasExtras ? 'True cost per year' : 'Tuition per year'}</b>
              {c.oneTime > 0 && <small>First year {num(c.firstYear)} KWD, including one-time fees</small>}
            </div>
            <span className="n">{num(c.perYear)}<i> KWD</i></span>
          </div>
          <div className="prev-cost-pills">
            {c.hasExtras && <span className="o">+{c.overTuitionPct}% over tuition</span>}
            <span className="t">≈ {num(c.perMonth)} KWD a month</span>
          </div>
        </>
      )}

      {err && <p className="prev-ch-err" role="alert">{err}</p>}
      {!selected && full && <p className="prev-ch-from">Your account holds the most children it can ({kids.maxChildren}). Remove one on My family to add another.</p>}
      <button type="button" className="btnO prev-cost-add" onClick={save} disabled={busy || !published || (!selected && full)}>
        <Users size={18} /> {selected ? `Use this school for ${name}` : 'Add This Child to My Family Plan'}
      </button>
    </div>
  )
}
