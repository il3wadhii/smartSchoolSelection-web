'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { SchoolCostInfo, costFor, feeKey, gradesOf, num } from '../lib/cost'
import { loadChildren, newChildId, saveChildren } from '../lib/family'

// "What it really costs" — bottom of the school's Fees tab. Tuition for one
// grade + the school's extra lines → true cost per year, first year, per month.

export function FeeSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`prev-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

export default function CostCalculator({ info }: { info: SchoolCostInfo }) {
  const router = useRouter()
  const grades = useMemo(() => gradesOf(info), [info])
  const [grade, setGrade] = useState(grades[0] || '')
  const [on, setOn] = useState<Record<string, boolean>>({})

  useEffect(() => { if (grades.length && !grades.includes(grade)) setGrade(grades[0]) }, [grades, grade])

  if (!grades.length) return null
  const c = costFor(info, grade, on, false)

  const addToFamily = () => {
    const kids = loadChildren()
    saveChildren([...kids, { id: newChildId(), name: `Child ${kids.length + 1}`, grade, schoolID: info.schoolID, schoolName: info.schoolName, on }])
    router.push('/preview/family')
  }

  return (
    <div className="prev-card prev-cost" aria-labelledby="cost-title">
      <h3 id="cost-title">What it really costs</h3>
      <p className="prev-cost-lead">Tuition plus the school&apos;s other charges, for one child.</p>

      <div className="prev-cost-label" id="cost-grade-label">Grade</div>
      <div className="prev-cost-grades" role="group" aria-labelledby="cost-grade-label">
        {grades.map((g) => (
          <button key={g} type="button" className={`prev-chip sm${g === grade ? ' on' : ''}`} aria-pressed={g === grade} onClick={() => setGrade(g)}>{g}</button>
        ))}
      </div>

      <div className="prev-cost-lines">
        <div className="prev-cost-line"><span className="l">Tuition · {grade}</span><span className="v">{num(c.tuition)}</span></div>
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

      <button type="button" className="btnO prev-cost-add" onClick={addToFamily}><Users size={18} /> Add This Child to My Family Plan</button>
    </div>
  )
}
