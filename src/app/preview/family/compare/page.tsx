'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { Child, SchoolCostInfo, familyTotals, num } from '../../lib/cost'
import { fetchCostInfo, loadChildren, onChildrenChange } from '../../lib/family'
import { readParam, writeParam } from '../../lib/urlState'

// Family cost compare: the same children costed at two schools, line by line.
// ?a=<schoolID>&b=<schoolID> keeps the pair in the link.

type Opt = { schoolID: number; schoolName: string }
type Side = 'a' | 'b'

export default function FamilyComparePage() {
  const { isAuthenticated } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [schools, setSchools] = useState<Opt[]>([])
  const [ids, setIds] = useState<Record<Side, number | null>>({ a: null, b: null })
  const [infos, setInfos] = useState<Record<Side, SchoolCostInfo | null>>({ a: null, b: null })
  const [loading, setLoading] = useState<Record<Side, boolean>>({ a: false, b: false })

  useEffect(() => {
    const kids = loadChildren()
    setChildren(kids)
    const a = Number(readParam('a')) || kids.find((c) => c.schoolID != null)?.schoolID || null
    const b = Number(readParam('b')) || null
    setIds({ a, b })
    return onChildrenChange(() => setChildren(loadChildren()))
  }, [])

  useEffect(() => {
    let alive = true
    schoolsAPI.list(1, 200).then((res) => {
      if (alive && res.success && res.data) {
        const list: Opt[] = (res.data.schools || []).map((s: any) => ({ schoolID: s.schoolID, schoolName: s.schoolName }))
        setSchools(list.sort((x, y) => x.schoolName.localeCompare(y.schoolName)))
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    let alive = true
    ;(['a', 'b'] as Side[]).forEach((side) => {
      const id = ids[side]
      if (!id || infos[side]?.schoolID === id) return
      setLoading((l) => ({ ...l, [side]: true }))
      fetchCostInfo(id).then((info) => {
        if (!alive) return
        setInfos((p) => ({ ...p, [side]: info }))
        setLoading((l) => ({ ...l, [side]: false }))
      })
    })
    return () => { alive = false }
  }, [ids, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (side: Side, v: string) => {
    const id = Number(v) || null
    setIds((p) => ({ ...p, [side]: id }))
    if (!id) setInfos((p) => ({ ...p, [side]: null }))
    writeParam(side, id ? String(id) : null)
  }

  const a = infos.a, b = infos.b
  const ta = useMemo(() => (a ? familyTotals(children, { [a.schoolID]: a }, a.schoolID) : null), [children, a])
  const tb = useMemo(() => (b ? familyTotals(children, { [b.schoolID]: b }, b.schoolID) : null), [children, b])

  const listed = (t: typeof ta) => !!t?.rows.some((r) => r.cost?.hasExtras)
  const la = listed(ta), lb = listed(tb)

  const rows = useMemo(() => {
    if (!ta || !tb) return []
    const pct = (t: NonNullable<typeof ta>) => (t.tuition ? Math.round(((t.perYear - t.tuition) / t.tuition) * 100) : 0)
    type Row = { label: string; a: number | null; b: number | null; suffix: string }
    const out: Row[] = [
      ...children.map((c, i) => ({ label: `${c.name} · ${ta.rows[i]?.grade || c.grade} tuition`, a: ta.rows[i]?.cost?.tuition || 0, b: tb.rows[i]?.cost?.tuition || 0, suffix: '' })),
      { label: 'Sibling discount', a: ta.discount ? -ta.discount : 0, b: tb.discount ? -tb.discount : 0, suffix: '' },
      { label: 'Extras per year', a: la ? ta.extras : null, b: lb ? tb.extras : null, suffix: '' },
      { label: 'One-time fees, first year', a: la ? ta.oneTime : null, b: lb ? tb.oneTime : null, suffix: '' },
      { label: 'Cost over tuition', a: la ? pct(ta) : null, b: lb ? pct(tb) : null, suffix: '%' },
    ]
    return out
  }, [children, ta, tb, la, lb])

  const diff = ta && tb ? Math.abs(ta.perYear - tb.perYear) : 0
  const cheaper = ta && tb && diff > 0 ? (ta.perYear < tb.perYear ? a : b) : null

  const Pick = ({ side }: { side: Side }) => (
    <div>
      <label htmlFor={`fc-${side}`}>School {side.toUpperCase()}</label>
      <select id={`fc-${side}`} name={`school${side.toUpperCase()}`} className="prev-select" value={ids[side] ?? ''} onChange={(e) => choose(side, e.target.value)}>
        <option value="">Choose a school…</option>
        {schools.map((s) => <option key={s.schoolID} value={s.schoolID}>{s.schoolName}</option>)}
      </select>
    </div>
  )

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c prev-fam">
        <Link href="/preview/family" className="prev-signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><ArrowLeft size={16} /> My family</Link>
        <div className="prev-fam-head">
          <div>
            <h1 className="prev-h2">Family cost, side by side</h1>
            <p>Your children at two schools: tuition, extras and the yearly total.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="prev-note">
            <span className="prev-note-ic"><Lock size={18} /></span>
            <div className="prev-note-txt"><b>Sign in to compare costs</b><p>Fees are free for registered parents.</p></div>
            <Link href="/preview/login?next=/preview/family/compare" className="btnT">Sign in</Link>
          </div>
        )}

        <div className="prev-card"><div className="prev-fc-pick"><Pick side="a" /><Pick side="b" /></div></div>

        {children.length === 0 ? (
          <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 15.5 }}>
            Add your children in <Link href="/preview/family" style={{ color: 'var(--teal)', fontWeight: 700 }}>My family</Link> first.
          </div>
        ) : loading.a || loading.b ? (
          <div className="prev-spinner" />
        ) : ta && tb && a && b ? (
          <div className="prev-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="prev-fc-table">
                <thead><tr><th scope="col"><span className="sr-only">Line</span></th><th scope="col">{a.schoolName}</th><th scope="col">{b.schoolName}</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <Cell v={r.a} other={r.b} suffix={r.suffix} />
                      <Cell v={r.b} other={r.a} suffix={r.suffix} />
                    </tr>
                  ))}
                  <tr className="total">
                    <td>Per year, KWD</td>
                    <td><span className={`v${ta.perYear < tb.perYear ? ' win' : ''}`}>{num(ta.perYear)}</span></td>
                    <td><span className={`v${tb.perYear < ta.perYear ? ' win' : ''}`}>{num(tb.perYear)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <span className="prev-fc-verdict" aria-live="polite">{cheaper ? `${cheaper.schoolName} costs ${num(diff)} KWD less a year` : 'Same yearly cost'}</span>
            {[!la && a, !lb && b].filter(Boolean).map((s) => (
              <p key={(s as SchoolCostInfo).schoolID} className="prev-kid-note">{(s as SchoolCostInfo).schoolName} hasn&apos;t listed its extra charges yet, so its total is tuition only.</p>
            ))}
            <div className="prev-fc-3y">
              <div className="prev-cost-label">Over 3 years at today&apos;s fees</div>
              <div className="prev-kv"><span className="k">{a.schoolName}</span><span className="v">≈ {num(ta.firstYear + ta.perYear * 2)} KWD</span></div>
              <div className="prev-kv"><span className="k">{b.schoolName}</span><span className="v">≈ {num(tb.firstYear + tb.perYear * 2)} KWD</span></div>
            </div>
          </div>
        ) : isAuthenticated ? (
          <div className="prev-card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 15.5 }}>Choose two schools above to compare your family&apos;s yearly cost.</div>
        ) : null}
      </div>
    </section>
  )
}

function Cell({ v, other, suffix }: { v: number | null; other: number | null; suffix: string }) {
  if (v === null) return <td><span className="v na">Not listed</span></td>
  const win = other !== null && v < other
  return <td><span className={`v${win ? ' win' : ''}`}>{num(v)}{suffix}</span></td>
}
