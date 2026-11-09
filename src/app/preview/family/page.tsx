'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Pencil, Plus, Scale, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { ChildPayload, ChildSaved, ImportItem, ServerChild } from '@/lib/childrenApi'
import { Child, SchoolCostInfo, familyTotals, feeKey, num } from '../lib/cost'
import { clearDeviceChildren, fetchCostInfo, importSnoozed, loadChildren, onChildrenChange, snoozeImport } from '../lib/family'
import { gradeOf, isOverride, nameOf, toCostChild, useChildren } from '../lib/children'
import { readParam, writeParam } from '../lib/urlState'
import { FeeSwitch } from '../components/CostCalculator'
import ChildForm from '../components/ChildForm'
import ImportDeviceChildren from '../components/ImportDeviceChildren'
import '../children.css'

// My family: each child (saved on the parent's account) with a grade and a
// school, costed with tuition + the school's extra charges, and the family's
// yearly total. The form lives at /preview/family?child=new|<id>.

const AV = ['#F4961E', '#1F8A78', '#5B4FA8', '#B4581A', '#2E6F95']
type Opt = { schoolID: number; schoolName: string }
type Note = { kind: 'ok' | 'err'; text: string } | null

const count = new Intl.NumberFormat('en-GB')

function savedNote(d: ChildSaved): string {
  let s = d.gradeChanged && d.child ? `Saved. The grade is now ${gradeOf(d.child) ?? 'not set'}.` : 'Saved.'
  const n = typeof d.alertsDeactivated === 'number' ? d.alertsDeactivated : d.alertsDeactivated ? 1 : 0
  if (n > 0) s += ` ${n > 1 ? `${count.format(n)} seat alerts` : 'A seat alert'} for the old grade ${n > 1 ? 'were' : 'was'} switched off.`
  return s
}

export default function FamilyPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const kids = useChildren(isAuthenticated)
  const [editing, setEditing] = useState<string | null>(null) // 'new' | childID
  const [infos, setInfos] = useState<Record<number, SchoolCostInfo>>({})
  const [schools, setSchools] = useState<Opt[]>([])
  const [confirmRm, setConfirmRm] = useState<number | null>(null)
  const [note, setNote] = useState<Note>(null)
  const [device, setDevice] = useState<Child[]>([])
  const [snoozed, setSnoozed] = useState(true)

  // ?child=new|<id> opens the form; written back with replaceState (no nickname or birth month ever)
  useEffect(() => {
    const p = readParam('child')
    if (p === 'new' || (p && /^\d+$/.test(p))) setEditing(p)
  }, [])
  const go = (v: string | null) => { setEditing(v); writeParam('child', v); if (typeof window !== 'undefined') window.scrollTo?.(0, 0) }

  // old device-only list, offered for import after sign-in
  useEffect(() => {
    if (!isAuthenticated) { setDevice([]); return }
    setDevice(loadChildren()); setSnoozed(importSnoozed())
    return onChildrenChange(() => setDevice(loadChildren()))
  }, [isAuthenticated])

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

  const editChild: ServerChild | null = editing && editing !== 'new' ? kids.children.find((c) => String(c.childID) === editing) || null : null
  // an id that is not in the list (deleted, or not ours) falls back to the list
  useEffect(() => {
    if (kids.loaded && editing && editing !== 'new' && !editChild) { setEditing(null); writeParam('child', null) }
  }, [kids.loaded, editing, editChild])

  const costKids = useMemo(
    () => kids.children.map((c) => toCostChild(c, kids.children, schools.find((s) => s.schoolID === c.targetSchoolID)?.schoolName)).filter((c): c is Child => c !== null),
    [kids.children, schools],
  )
  const noGrade = kids.children.length - costKids.length

  // cost info for every school a child is at
  useEffect(() => {
    if (!isAuthenticated) return
    const ids = [...new Set(costKids.map((c) => c.schoolID).filter((x): x is number => x != null))].filter((id) => !infos[id])
    if (!ids.length) return
    let alive = true
    Promise.all(ids.map(fetchCostInfo)).then((list) => {
      if (!alive) return
      const add: Record<number, SchoolCostInfo> = {}
      list.forEach((info) => { if (info) add[info.schoolID] = info })
      if (Object.keys(add).length) setInfos((p) => ({ ...p, ...add }))
    })
    return () => { alive = false }
  }, [costKids, infos, isAuthenticated])

  const totals = useMemo(() => familyTotals(costKids, infos), [costKids, infos])
  const rowById = useMemo(() => Object.fromEntries(totals.rows.map((r) => [r.child.id, r])), [totals])

  const patch = async (c: ServerChild, p: ChildPayload) => {
    const r = await kids.update(c.childID, p)
    if (!r.ok) setNote({ kind: 'err', text: r.message })
  }

  const onSave = async (payload: ChildPayload): Promise<string | null> => {
    if (editing === 'new') {
      const r = await kids.create(payload)
      if (!r.ok) return r.message
      setNote({ kind: 'ok', text: 'Child added.' })
    } else if (editChild) {
      const r = await kids.update(editChild.childID, payload)
      if (!r.ok) return r.message
      setNote({ kind: 'ok', text: savedNote(r.data) })
    }
    go(null)
    return null
  }

  const doRemove = async (c: ServerChild) => {
    const r = await kids.remove(c.childID)
    setConfirmRm(null)
    setNote(r.ok ? { kind: 'ok', text: 'Removed.' } : { kind: 'err', text: r.message })
  }

  const doImport = async (items: ImportItem[]): Promise<{ ok: boolean; message: string }> => {
    const r = await kids.importDevice(items)
    if (!r.ok) return { ok: false, message: r.message }
    const rej = Array.isArray(r.data.rejected) ? r.data.rejected.length : Number(r.data.rejected) || 0
    if (rej === 0) {
      clearDeviceChildren(); setDevice([])
      setNote({ kind: 'ok', text: 'Added to your account.' })
    } else {
      setNote({ kind: 'err', text: `${count.format(rej)} could not be added and ${rej > 1 ? 'are' : 'is'} still saved on this device.` })
    }
    return { ok: true, message: '' }
  }

  if (isLoading || (isAuthenticated && !kids.loaded)) return <div className="prev-c"><div className="prev-spinner" /></div>

  const header = (
    <div className="prev-fam-head">
      <div>
        <h1 className="prev-h2">My family</h1>
        <p>Each child&apos;s school and grade, and what the whole family pays in a year.</p>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <section className="prev-section" style={{ paddingTop: 26 }}>
        <div className="prev-c prev-fam">
          {header}
          <div className="prev-note">
            <span className="prev-note-ic"><Lock size={18} /></span>
            <div className="prev-note-txt">
              <b>Sign in to save your children and see fees</b>
              <p>It is free. Your children and their costs stay on your account.</p>
            </div>
            <Link href="/preview/login?next=/preview/family" className="btnT">Sign in</Link>
          </div>
        </div>
      </section>
    )
  }

  const atMax = kids.children.length >= kids.maxChildren
  const showForm = editing === 'new' || !!editChild

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c prev-fam prev-ch">
        {header}

        {note && <p className={note.kind === 'ok' ? 'prev-ch-ok' : 'prev-ch-err'} role={note.kind === 'ok' ? 'status' : 'alert'}>{note.text}</p>}
        {kids.error && <p className="prev-ch-err" role="alert">{kids.error}</p>}

        {showForm ? (
          <ChildForm key={editing} child={editChild} academicYear={kids.academicYear} gradeRuleConfirmed={kids.gradeRuleConfirmed}
            onSave={onSave} onCancel={() => go(null)} />
        ) : (
          <>
            {device.length > 0 && !snoozed && (
              <ImportDeviceChildren device={device} room={kids.maxChildren - kids.children.length}
                onImport={doImport} onSnooze={() => { snoozeImport(); setSnoozed(true) }} />
            )}

            {kids.children.length === 0 && (
              <div className="prev-card prev-ch-empty">
                <p>No children yet.</p>
                <button type="button" className="btnO" onClick={() => go('new')}><Plus size={18} /> Add a child</button>
              </div>
            )}

            {kids.children.map((c, i) => {
              const r = rowById[String(c.childID)]
              const name = nameOf(c, kids.children)
              const g = gradeOf(c)
              const opt = r?.info ? r.info.extraFees.filter((x) => x.mode === 'optional') : []
              const on = (c.extras?.on || {}) as Record<string, boolean>
              return (
                <div key={c.childID} className="prev-card prev-kid prev-ch-card">
                  <div className="prev-kid-top">
                    <span className="prev-kid-av" style={{ background: AV[i % AV.length] }} aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                    <div className="prev-kid-id">
                      <b style={{ fontFamily: 'var(--font-poppins)', fontSize: 17, color: 'var(--ink)' }}>{name}</b>
                      <div className="prev-ch-line">
                        {g
                          ? <span className="prev-ch-grade">{g} · {kids.academicYear}</span>
                          : <span className="prev-ch-grade none">No grade yet</span>}
                        {g && isOverride(c) && <span className="prev-ch-own">Your choice</span>}
                        {g && !isOverride(c) && !kids.gradeRuleConfirmed && <span className="prev-est">estimate</span>}
                      </div>
                      <select className="prev-select prev-kid-school" value={c.targetSchoolID ?? ''} aria-label={`School for ${name}`} name={`school-${c.childID}`} autoComplete="off"
                        onChange={(e) => patch(c, { targetSchoolID: e.target.value ? Number(e.target.value) : null, extras: { ...(c.extras || {}), on: {} } })}>
                        <option value="">Choose a school…</option>
                        {c.targetSchoolID != null && !schools.some((s) => s.schoolID === c.targetSchoolID) && <option value={c.targetSchoolID}>{rowById[String(c.childID)]?.info?.schoolName || 'Chosen school'}</option>}
                        {schools.map((s) => <option key={s.schoolID} value={s.schoolID}>{s.schoolName}</option>)}
                      </select>
                    </div>
                    <div className="prev-kid-cost" aria-live="polite">
                      {r?.cost ? <><b>{num(r.cost.perYear)}</b><small>KWD a year</small></> : c.targetSchoolID != null && g ? <small>Loading…</small> : null}
                    </div>
                    <div className="prev-ch-acts">
                      <button type="button" className="prev-ch-act" aria-label={`Edit ${name}`} onClick={() => go(String(c.childID))}><Pencil size={16} aria-hidden="true" /> Edit</button>
                      <button type="button" className="prev-ch-act rm" aria-label={`Remove ${name}`} onClick={() => setConfirmRm(c.childID)}><Trash2 size={16} aria-hidden="true" /> Remove</button>
                    </div>
                  </div>

                  {confirmRm === c.childID && (
                    <div className="prev-kid-confirm" role="alert">
                      Remove {name}? This removes the profile from your account. Seat alerts you set stay in your account.{' '}
                      <Link href="/preview/saved" style={{ color: 'var(--teald)', fontWeight: 700, textDecoration: 'underline' }}>See your seat alerts</Link>
                      <button type="button" className="yes" onClick={() => doRemove(c)}>Remove</button>
                      <button type="button" className="no" onClick={() => setConfirmRm(null)}>Keep</button>
                    </div>
                  )}

                  {!g && <p className="prev-kid-note">Add a birth month or choose a grade to see the cost. <Link href={`/preview/family?child=${c.childID}`} style={{ color: 'var(--teald)', fontWeight: 700 }}>Edit {name}</Link></p>}
                  {r?.gradeAdjusted && <p className="prev-kid-note">{r.info?.schoolName} doesn&apos;t list fees for {g}, so this uses {r.grade}.</p>}

                  {opt.map((x) => {
                    const k = feeKey(x); const active = !!on[k]
                    return (
                      <div key={k} className={`prev-kid-opt${active ? '' : ' off'}`}>
                        <span className="l"><FeeSwitch checked={active} label={`${x.label} for ${name}`} onChange={(v) => patch(c, { extras: { ...(c.extras || {}), on: { ...on, [k]: v } } })} />{x.label}</span>
                        <span className="v">{num(x.amount)}</span>
                      </div>
                    )
                  })}
                  {r?.cost && r.isSibling && r.cost.discount > 0 && (
                    <div className="prev-kid-sib"><span>Sibling discount −{r.info?.siblingDiscountPct}% on tuition</span><span>−{num(r.cost.discount)}</span></div>
                  )}
                  {r?.cost && !r.cost.hasExtras && <p className="prev-kid-note">Tuition only. This school hasn&apos;t listed its other charges yet.</p>}
                </div>
              )
            })}

            {kids.children.length > 0 && (
              <div style={{ margin: '4px 0 16px' }}>
                {atMax
                  ? <p className="prev-ch-hint">You have {count.format(kids.maxChildren)} children, the most an account can hold.</p>
                  : <button type="button" className="btnO" onClick={() => go('new')}><Plus size={18} /> Add a child</button>}
                <p className="prev-ch-consent">Stored on your account: nickname, birth month and year, grade. Delete any time.</p>
              </div>
            )}

            {kids.children.length > 0 && (
              <div className="prev-fam-total">
                <div className="k">Whole family · per year</div>
                <div className="row">
                  <div>
                    {totals.oneTime > 0 && <div className="sub">First year {num(totals.firstYear)} KWD, including one-time fees</div>}
                    {totals.missing > 0 && <div className="sub warn">{totals.missing} {totals.missing > 1 ? 'children' : 'child'} without a school yet</div>}
                    {noGrade > 0 && <div className="sub warn">{noGrade} {noGrade > 1 ? 'children' : 'child'} without a grade, not counted</div>}
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
          </>
        )}
      </div>
    </section>
  )
}
