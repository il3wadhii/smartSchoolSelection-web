'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Users, X, Scale } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { Child, GRADE_ORDER, SchoolCostInfo, familyTotals, feeKey, num } from '../lib/cost'
import { fetchCostInfo, loadChildren, newChildId, onChildrenChange, saveChildren } from '../lib/family'
import { FeeSwitch } from '../components/CostCalculator'

// My family: each child with a grade and a school, costed with tuition + the
// school's extra charges, and the whole family's yearly total.

const AV = ['#F4961E', '#1F8A78', '#5B4FA8', '#B4581A', '#2E6F95']
type Opt = { schoolID: number; schoolName: string }

export default function FamilyPage() {
  const { isAuthenticated } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [ready, setReady] = useState(false)
  const [infos, setInfos] = useState<Record<number, SchoolCostInfo>>({})
  const [schools, setSchools] = useState<Opt[]>([])
  const [confirmRm, setConfirmRm] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('KG1')
  const [schoolID, setSchoolID] = useState('')

  useEffect(() => {
    setChildren(loadChildren()); setReady(true)
    return onChildrenChange(() => setChildren(loadChildren()))
  }, [])

  useEffect(() => {
    let alive = true
    schoolsAPI.list(1, 200).then((res) => {
      if (alive && res.success && res.data) {
        const list: Opt[] = (res.data.schools || []).map((s: any) => ({ schoolID: s.schoolID, schoolName: s.schoolName }))
        setSchools(list.sort((a, b) => a.schoolName.localeCompare(b.schoolName)))
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  // cost info for every school a child is at
  useEffect(() => {
    if (!isAuthenticated) return
    const ids = [...new Set(children.map((c) => c.schoolID).filter((x): x is number => x != null))].filter((id) => !infos[id])
    if (!ids.length) return
    let alive = true
    Promise.all(ids.map(fetchCostInfo)).then((list) => {
      if (!alive) return
      const add: Record<number, SchoolCostInfo> = {}
      list.forEach((info) => { if (info) add[info.schoolID] = info })
      if (Object.keys(add).length) setInfos((p) => ({ ...p, ...add }))
    })
    return () => { alive = false }
  }, [children, infos, isAuthenticated])

  const totals = useMemo(() => familyTotals(children, infos), [children, infos])

  const persist = (next: Child[]) => { setChildren(next); saveChildren(next) }
  const update = (id: string, patch: Partial<Child>) => persist(children.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const addChild = (e: React.FormEvent) => {
    e.preventDefault()
    const s = schools.find((x) => String(x.schoolID) === schoolID)
    persist([...children, { id: newChildId(), name: name.trim() || `Child ${children.length + 1}`, grade, schoolID: s?.schoolID ?? null, schoolName: s?.schoolName, on: {} }])
    setName(''); setSchoolID('')
  }

  if (!ready) return <div className="prev-c"><div className="prev-spinner" /></div>

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c prev-fam">
        <div className="prev-fam-head">
          <div>
            <h1 className="prev-h2">My family</h1>
            <p>Each child&apos;s school and grade, and what the whole family pays in a year.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="prev-note">
            <span className="prev-note-ic"><Lock size={18} /></span>
            <div className="prev-note-txt">
              <b>Sign in to see the costs</b>
              <p>Fees are free for registered parents. Your children stay saved in this browser either way.</p>
            </div>
            <Link href="/preview/login?next=/preview/family" className="btnT">Sign in</Link>
          </div>
        )}

        {children.length === 0 && (
          <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 15.5 }}>
            No children yet. Add one below, or open any school&apos;s <b style={{ color: 'var(--ink)' }}>Fees</b> tab and choose “Add This Child to My Family Plan”.
          </div>
        )}

        {totals.rows.map((r, i) => {
          const c = r.child
          const opt = r.info ? r.info.extraFees.filter((x) => x.mode === 'optional') : []
          return (
            <div key={c.id} className="prev-card prev-kid">
              <div className="prev-kid-top">
                <span className="prev-kid-av" style={{ background: AV[i % AV.length] }} aria-hidden="true">{(c.name || '?').charAt(0).toUpperCase()}</span>
                <div className="prev-kid-id">
                  <input className="prev-kid-name" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} aria-label="Child's name" name={`child-${c.id}`} autoComplete="off" spellCheck={false} />
                  <select className="prev-select prev-kid-school" value={c.schoolID ?? ''} aria-label={`School for ${c.name}`}
                    onChange={(e) => { const s = schools.find((x) => String(x.schoolID) === e.target.value); update(c.id, { schoolID: s?.schoolID ?? null, schoolName: s?.schoolName, on: {} }) }}>
                    <option value="">Choose a school…</option>
                    {c.schoolID != null && !schools.some((s) => s.schoolID === c.schoolID) && <option value={c.schoolID}>{c.schoolName}</option>}
                    {schools.map((s) => <option key={s.schoolID} value={s.schoolID}>{s.schoolName}</option>)}
                  </select>
                </div>
                <div className="prev-kid-cost" aria-live="polite">
                  {r.cost ? <><b>{num(r.cost.perYear)}</b><small>KWD a year</small></> : c.schoolID != null && isAuthenticated ? <small>Loading…</small> : null}
                </div>
                <button type="button" className="prev-kid-rm" aria-label={`Remove ${c.name}`} onClick={() => setConfirmRm(c.id)}><X size={18} /></button>
              </div>

              {confirmRm === c.id && (
                <div className="prev-kid-confirm" role="alert">
                  Remove {c.name} from your family plan?
                  <button type="button" className="yes" onClick={() => { persist(children.filter((x) => x.id !== c.id)); setConfirmRm(null) }}>Remove</button>
                  <button type="button" className="no" onClick={() => setConfirmRm(null)}>Keep</button>
                </div>
              )}

              <div className="prev-cost-grades" role="group" aria-label={`Grade next year for ${c.name}`}>
                {GRADE_ORDER.map((g) => (
                  <button key={g} type="button" className={`prev-chip sm${g === c.grade ? ' on' : ''}`} aria-pressed={g === c.grade} onClick={() => update(c.id, { grade: g })}>{g}</button>
                ))}
              </div>
              {r.gradeAdjusted && <p className="prev-kid-note">{r.info?.schoolName} doesn&apos;t list fees for {c.grade}, so this uses {r.grade}.</p>}

              {opt.map((x) => {
                const k = feeKey(x); const active = !!c.on[k]
                return (
                  <div key={k} className={`prev-kid-opt${active ? '' : ' off'}`}>
                    <span className="l"><FeeSwitch checked={active} label={`${x.label} for ${c.name}`} onChange={(v) => update(c.id, { on: { ...c.on, [k]: v } })} />{x.label}</span>
                    <span className="v">{num(x.amount)}</span>
                  </div>
                )
              })}
              {r.cost && r.isSibling && r.cost.discount > 0 && (
                <div className="prev-kid-sib"><span>Sibling discount −{r.info?.siblingDiscountPct}% on tuition</span><span>−{num(r.cost.discount)}</span></div>
              )}
              {r.cost && !r.cost.hasExtras && <p className="prev-kid-note">Tuition only. This school hasn&apos;t listed its other charges yet.</p>}
            </div>
          )
        })}

        <form className="prev-card prev-fam-add" onSubmit={addChild}>
          <h3>Add a child</h3>
          <div className="row">
            <div>
              <label htmlFor="fam-name">Name</label>
              <input id="fam-name" name="childName" className="prev-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sara…" autoComplete="off" spellCheck={false} />
            </div>
            <div>
              <label htmlFor="fam-school">School <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
              <select id="fam-school" name="school" className="prev-select" value={schoolID} onChange={(e) => setSchoolID(e.target.value)}>
                <option value="">Choose a school…</option>
                {schools.map((s) => <option key={s.schoolID} value={s.schoolID}>{s.schoolName}</option>)}
              </select>
            </div>
          </div>
          <div className="prev-cost-label grades-label" id="fam-grade-label">Grade next year</div>
          <div className="prev-cost-grades" role="group" aria-labelledby="fam-grade-label">
            {GRADE_ORDER.map((g) => (
              <button key={g} type="button" className={`prev-chip sm${g === grade ? ' on' : ''}`} aria-pressed={g === grade} onClick={() => setGrade(g)}>{g}</button>
            ))}
          </div>
          <button type="submit" className="btnT"><Users size={16} /> Add Child</button>
        </form>

        {children.length > 0 && isAuthenticated && (
          <div className="prev-fam-total">
            <div className="k">Whole family · per year</div>
            <div className="row">
              <div>
                {totals.oneTime > 0 && <div className="sub">First year {num(totals.firstYear)} KWD, including one-time fees</div>}
                {totals.missing > 0 && <div className="sub warn">{totals.missing} {totals.missing > 1 ? 'children' : 'child'} without a school yet</div>}
              </div>
              <div className="n" aria-live="polite">{num(totals.perYear)}<i> KWD</i></div>
            </div>
            <div className="tags">
              <span>≈ {num(totals.perMonth)} KWD a month</span>
              <span>Tuition {num(totals.tuition - totals.discount)} + extras {num(totals.extras)}</span>
              {totals.discount > 0 && <span>Siblings save {num(totals.discount)}</span>}
            </div>
            <Link href="/preview/family/compare" className="btnT go"><Scale size={16} /> Compare With Another School</Link>
          </div>
        )}
      </div>
    </section>
  )
}
