// Family cost calculator maths — ported 1:1 from the app (RN src/utils/cost.ts).
// The school Fees tab, My family and the family Compare all use these functions.
//
// Rules: yearly lines are added per child every year · one-time lines count in
// the first year only · "included" lines always count · "optional" lines only
// when the parent switches them on for that child · "hidden" lines never show ·
// the sibling discount applies to tuition only, to every child after the first
// at the same school · monthly = yearly ÷ 12.

export type ExtraFeeMode = 'included' | 'optional' | 'hidden';
export type ExtraFeeFrequency = 'yearly' | 'one_time';

export interface ExtraFee {
  extraFeeID?: number;
  label: string;
  amount: number;
  frequency: ExtraFeeFrequency;
  mode: ExtraFeeMode;
}

export interface GradeFee {
  grade: string;
  fees: number;
}

/** What the app needs to know about a school to cost it. */
export interface SchoolCostInfo {
  schoolID: number;
  schoolName: string;
  gradeFees: GradeFee[];
  extraFees: ExtraFee[];
  siblingDiscountPct: number;
}

export interface Child {
  id: string;
  name: string;
  grade: string;          // grade next year, e.g. "KG2", "Grade 3"
  schoolID: number | null;
  schoolName?: string;
  /** optional lines switched on for this child, by extraFeeID or label */
  on: Record<string, boolean>;
}

export const GRADE_ORDER = [
  'Preschool', 'KG1', 'KG2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13',
];

export const normalizeGrade = (g: string): string => {
  const t = (g || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

export const feeKey = (x: ExtraFee): string => (x.extraFeeID != null ? String(x.extraFeeID) : x.label);

export function gradesOf(info: SchoolCostInfo): string[] {
  const have = new Set(info.gradeFees.filter((f) => Number(f.fees) > 0).map((f) => normalizeGrade(f.grade)));
  return GRADE_ORDER.filter((g) => have.has(g));
}

export function tuitionFor(info: SchoolCostInfo, grade: string): number {
  const row = info.gradeFees.find((f) => normalizeGrade(f.grade) === normalizeGrade(grade));
  return Number(row?.fees) || 0;
}

export interface CostLine extends ExtraFee {
  optional: boolean;
  active: boolean;
}

export interface CostResult {
  tuition: number;
  discount: number;
  extrasYearly: number;
  oneTime: number;
  perYear: number;
  firstYear: number;
  perMonth: number;
  overTuitionPct: number;
  lines: CostLine[];
  hasExtras: boolean; // false → "extras not provided by the school yet"
}

export function costFor(info: SchoolCostInfo, grade: string, on: Record<string, boolean>, isSibling: boolean): CostResult {
  const tuition = tuitionFor(info, grade);
  const discount = isSibling ? (tuition * (Number(info.siblingDiscountPct) || 0)) / 100 : 0;
  let extrasYearly = 0;
  let oneTime = 0;
  const lines: CostLine[] = [];
  for (const x of info.extraFees || []) {
    if (x.mode === 'hidden') continue;
    const optional = x.mode === 'optional';
    const active = !optional || !!on[feeKey(x)];
    lines.push({ ...x, optional, active });
    if (!active) continue;
    if (x.frequency === 'one_time') oneTime += Number(x.amount) || 0;
    else extrasYearly += Number(x.amount) || 0;
  }
  const perYear = tuition - discount + extrasYearly;
  return {
    tuition,
    discount,
    extrasYearly,
    oneTime,
    perYear,
    firstYear: perYear + oneTime,
    perMonth: perYear / 12,
    overTuitionPct: tuition ? Math.round(((perYear - tuition) / tuition) * 100) : 0,
    lines,
    hasExtras: lines.length > 0,
  };
}

export interface FamilyRow {
  child: Child;
  info: SchoolCostInfo | null;
  grade: string;
  gradeAdjusted: boolean;
  isSibling: boolean;
  cost: CostResult | null;
}

export interface FamilyTotals {
  rows: FamilyRow[];
  perYear: number;
  firstYear: number;
  perMonth: number;
  tuition: number;
  discount: number;
  extras: number;
  oneTime: number;
  missing: number; // children whose school info isn't loaded yet
}

/**
 * Cost the whole family. `infos` is keyed by schoolID; `schoolOverride` costs
 * every child at one school (used by Compare).
 */
export function familyTotals(children: Child[], infos: Record<number, SchoolCostInfo>, schoolOverride?: number): FamilyTotals {
  const seen: Record<number, boolean> = {};
  const t: FamilyTotals = { rows: [], perYear: 0, firstYear: 0, perMonth: 0, tuition: 0, discount: 0, extras: 0, oneTime: 0, missing: 0 };
  for (const child of children) {
    const sid = schoolOverride ?? child.schoolID;
    const info = sid != null ? infos[sid] : undefined;
    if (!info) {
      t.missing++;
      t.rows.push({ child, info: null, grade: child.grade, gradeAdjusted: false, isSibling: false, cost: null });
      continue;
    }
    const grades = gradesOf(info);
    const grade = grades.includes(normalizeGrade(child.grade)) ? normalizeGrade(child.grade) : grades[0] || child.grade;
    const isSibling = !!seen[info.schoolID];
    seen[info.schoolID] = true;
    const cost = costFor(info, grade, child.on || {}, isSibling);
    t.rows.push({ child, info, grade, gradeAdjusted: grade !== normalizeGrade(child.grade), isSibling, cost });
    t.perYear += cost.perYear;
    t.firstYear += cost.firstYear;
    t.tuition += cost.tuition;
    t.discount += cost.discount;
    t.extras += cost.extrasYearly;
    t.oneTime += cost.oneTime;
  }
  t.perMonth = t.perYear / 12;
  return t;
}

const _num = new Intl.NumberFormat("en-KW", { maximumFractionDigits: 0 })
export const num = (n: number): string => _num.format(Math.round(n))
export const kwd = (n: number): string => `${num(n)} KWD`
