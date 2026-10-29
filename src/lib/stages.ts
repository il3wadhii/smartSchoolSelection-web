// Map a school's free-text 'Educational Stage' range (e.g. "KG 1 - Grade 12",
// "Preschool - Grade 12", "Grade 1 - Grade 12") onto the four Stage Line
// buckets that define the product's visual identity.

export type StageKey = 'nur' | 'kg' | 'pri' | 'int' | 'high'

export const STAGE_LABEL: Record<StageKey, string> = {
  nur: 'Preschool',
  kg: 'KG',
  pri: 'Primary',
  int: 'Intermediate',
  high: 'High school',
}

export const ALL_STAGES: StageKey[] = ['nur', 'kg', 'pri', 'int', 'high']

// Same ordering scale as lib/filters.ts: Preschool=0, KG1=1, KG2=2, Grade N=N+2
const stageOrder = (stage: string): number => {
  const s = stage.toLowerCase().trim()
  if (s.includes('preschool') || s.includes('pre-school') || s.includes('pre school') || s.includes('nursery')) return 0
  if (s.includes('kg 1') || s === 'kg1' || s === 'kg') return 1
  if (s.includes('kg 2') || s === 'kg2') return 2
  const match = s.match(/grade\s*(\d+)/i)
  if (match) return parseInt(match[1], 10) + 2
  if (s.includes('elementary')) return 3
  if (s.includes('middle') || s.includes('intermediate')) return 8
  if (s.includes('high')) return 12
  if (s.includes('secondary')) return 11
  if (s.includes('full')) return 14
  return -1
}

// Bucket spans on the order scale: nur [0,0], kg [1,2], pri [3,7] (G1–5),
// int [8,11] (G6–9), high [12,15] (G10–13 — British schools have Year 13)
const BUCKETS: Record<StageKey, [number, number]> = {
  nur: [0, 0],
  kg: [1, 2],
  pri: [3, 7],
  int: [8, 11],
  high: [12, 15],
}

export function schoolStages(educationalStage: string | null | undefined): StageKey[] {
  if (!educationalStage) return []
  const parts = educationalStage.split('-').map((p) => p.trim()).filter(Boolean)
  let min: number
  let max: number
  if (parts.length >= 2) {
    min = stageOrder(parts[0])
    max = stageOrder(parts[parts.length - 1])
  } else {
    min = max = stageOrder(parts[0] || '')
  }
  if (min === -1 && max === -1) return []
  if (min === -1) min = max
  if (max === -1) max = min
  if (min > max) [min, max] = [max, min]

  return ALL_STAGES.filter((key) => {
    const [lo, hi] = BUCKETS[key]
    return min <= hi && max >= lo
  })
}

// Lowest fee per Stage Line bucket, from per-grade fee rows
export function feesByStage(
  gradeFees: Array<{ grade: string; fees: number }> | null | undefined
): Partial<Record<StageKey, number>> {
  if (!gradeFees || gradeFees.length === 0) return {}
  const result: Partial<Record<StageKey, number>> = {}
  for (const row of gradeFees) {
    const order = stageOrder(row.grade)
    if (order === -1) continue
    const key = ALL_STAGES.find((k) => order >= BUCKETS[k][0] && order <= BUCKETS[k][1])
    if (!key) continue
    const fee = Number(row.fees)
    if (!Number.isFinite(fee) || fee <= 0) continue
    if (result[key] === undefined || fee < result[key]!) result[key] = fee
  }
  return result
}

// Group per-grade fees under their Stage Line bucket, ordered, each with its
// cheapest fee — for the expandable "Annual fees by stage" accordion.
export interface StageFeeGroup {
  key: StageKey
  label: string
  grades: { grade: string; fees: number }[]
  from: number
}

export function feesByStageGroups(
  gradeFees: Array<{ grade: string; fees: number }> | null | undefined
): StageFeeGroup[] {
  if (!gradeFees || gradeFees.length === 0) return []
  const groups: Record<StageKey, { grade: string; fees: number; order: number }[]> = {
    nur: [], kg: [], pri: [], int: [], high: [],
  }
  for (const row of gradeFees) {
    const order = stageOrder(row.grade)
    if (order === -1) continue
    const key = ALL_STAGES.find((k) => order >= BUCKETS[k][0] && order <= BUCKETS[k][1])
    if (!key) continue
    const fee = Number(row.fees)
    if (!Number.isFinite(fee) || fee <= 0) continue
    groups[key].push({ grade: row.grade, fees: fee, order })
  }
  return ALL_STAGES.filter((k) => groups[k].length > 0).map((k) => {
    const sorted = groups[k]
      .sort((a, b) => a.order - b.order)
      .map(({ grade, fees }) => ({ grade, fees }))
    return { key: k, label: STAGE_LABEL[k], grades: sorted, from: Math.min(...sorted.map((g) => g.fees)) }
  })
}

// Per-stage groups with each grade's fees AND available seats — powers the
// expandable "fees & seats by stage" accordion on the school detail page.
export interface StageGradeGroup {
  key: StageKey
  label: string
  rows: { grade: string; fees: number | null; seats: number | null }[]
  feeFrom: number | null
  seatsTotal: number | null
}

export function stageGradeGroups(
  gradeFees: Array<{ grade: string; fees: number }> | null | undefined,
  availability: Array<{ grade: string; availableSpots: number }> | null | undefined
): StageGradeGroup[] {
  const byGrade: Record<string, { fees: number | null; seats: number | null; order: number }> = {}
  const ensure = (grade: string) => {
    if (!byGrade[grade]) byGrade[grade] = { fees: null, seats: null, order: stageOrder(grade) }
    return byGrade[grade]
  }
  ;(gradeFees || []).forEach((f) => {
    const fee = Number(f.fees)
    if (Number.isFinite(fee) && fee > 0) ensure(f.grade).fees = fee
  })
  ;(availability || []).forEach((a) => {
    const s = Number(a.availableSpots)
    if (Number.isFinite(s)) ensure(a.grade).seats = s
  })
  const groups: Record<StageKey, Array<{ grade: string; fees: number | null; seats: number | null; order: number }>> = {
    nur: [], kg: [], pri: [], int: [], high: [],
  }
  Object.entries(byGrade).forEach(([grade, v]) => {
    if (v.order === -1) return
    const key = ALL_STAGES.find((k) => v.order >= BUCKETS[k][0] && v.order <= BUCKETS[k][1])
    if (key) groups[key].push({ grade, ...v })
  })
  return ALL_STAGES.filter((k) => groups[k].length > 0).map((k) => {
    const rows = groups[k].sort((a, b) => a.order - b.order).map(({ grade, fees, seats }) => ({ grade, fees, seats }))
    const feeVals = rows.map((r) => r.fees).filter((x): x is number => x !== null)
    const seatVals = rows.map((r) => r.seats).filter((x): x is number => x !== null)
    return {
      key: k,
      label: STAGE_LABEL[k],
      rows,
      feeFrom: feeVals.length ? Math.min(...feeVals) : null,
      seatsTotal: seatVals.length ? seatVals.reduce((a, b) => a + b, 0) : null,
    }
  })
}

// Exact grades as stored in school_fees / school_availability rows
export const EXACT_GRADES = [
  'KG1', 'KG2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'Grade 13', // British Year 13 (A-levels) — real fee rows exist for it
]

// Grade-range filter chips for the finder ("My child is in…").
// Finer-grained than the four Stage Line buckets, on the same order scale.
export type GradeFilterKey = 'pre' | 'kg' | 'g1_5' | 'g6_9' | 'g10_12'

export const GRADE_CHIPS: Array<{ label: string; sub: string; key: GradeFilterKey }> = [
  { label: 'Preschool', sub: '0–3 yrs', key: 'pre' },
  { label: 'KG', sub: '3–5 yrs', key: 'kg' },
  { label: 'Grade 1–5', sub: '6–10 yrs', key: 'g1_5' },
  { label: 'Grade 6–9', sub: '11–14 yrs', key: 'g6_9' },
  { label: 'Grade 10–12', sub: '15–18 yrs', key: 'g10_12' },
]

const FILTER_SPANS: Record<GradeFilterKey, [number, number]> = {
  pre: [0, 0],
  kg: [1, 2],
  g1_5: [3, 7],   // Grade 1–5
  g6_9: [8, 11],  // Grade 6–9
  g10_12: [12, 15], // Grade 10–13 (incl. British Year 13)
}

// Does the school's stage range overlap the selected grade-range filter?
export function matchesGradeFilter(
  educationalStage: string | null | undefined,
  filter: GradeFilterKey
): boolean {
  if (!educationalStage) return false
  const parts = educationalStage.split('-').map((p) => p.trim()).filter(Boolean)
  let min: number
  let max: number
  if (parts.length >= 2) {
    min = stageOrder(parts[0])
    max = stageOrder(parts[parts.length - 1])
  } else {
    min = max = stageOrder(parts[0] || '')
  }
  if (min === -1 && max === -1) return false
  if (min === -1) min = max
  if (max === -1) max = min
  if (min > max) [min, max] = [max, min]
  const [lo, hi] = FILTER_SPANS[filter]
  return min <= hi && max >= lo
}
