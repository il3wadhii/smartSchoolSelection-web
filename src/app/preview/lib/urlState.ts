// Keeps list filters in the URL query (?q=&grade=&seats=1) without a full
// navigation, so filtered views are shareable and survive a reload.
import { GradeFilterKey, GRADE_CHIPS } from '@/lib/stages'

export interface Filters { q: string; grade: GradeFilterKey | null; seats: boolean }

export function readFilters(): Filters {
  if (typeof window === 'undefined') return { q: '', grade: null, seats: false }
  const p = new URLSearchParams(window.location.search)
  const g = p.get('grade')
  const grade = GRADE_CHIPS.some((c) => c.key === g) ? (g as GradeFilterKey) : null
  return { q: p.get('q') || '', grade, seats: p.get('seats') === '1' }
}

export function writeFilters(f: Filters) {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  f.q ? p.set('q', f.q) : p.delete('q')
  f.grade ? p.set('grade', f.grade) : p.delete('grade')
  f.seats ? p.set('seats', '1') : p.delete('seats')
  const qs = p.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, '', next)
  }
}

/** One named query param (e.g. ?tab=fees), read once and written with replaceState. */
export function readParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}
export function writeParam(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  value ? p.set(key, value) : p.delete(key)
  const qs = p.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
}
