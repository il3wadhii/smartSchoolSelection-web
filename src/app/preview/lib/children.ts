'use client'
// The signed-in parent's children from the API: one hook + small helpers.
// Nickname and birth month are never put in URLs, logs or console output.
import { useCallback, useEffect, useState } from 'react'
import { ApiResponse } from '@/types'
import {
  ChildPayload, ChildSaved, ImportItem, ImportResult, ServerChild, childrenAPI,
} from '@/lib/childrenApi'
import { Child, GRADE_ORDER, normalizeGrade } from './cost'

export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

async function call<T>(fn: () => Promise<ApiResponse<T>>, fallback: string): Promise<Result<T>> {
  try {
    const r = await fn()
    return r.success ? { ok: true, data: r.data as T } : { ok: false, message: r.message || fallback }
  } catch (e: any) {
    return { ok: false, message: e?.response?.data?.message || fallback }
  }
}

/** The grade used for costing and alerts: the parent's choice, else the API's grade, else the suggestion. */
export function gradeOf(c: ServerChild): string | null {
  const o = c.extras && typeof c.extras.gradeOverride === 'string' ? c.extras.gradeOverride : ''
  const g = o || c.grade || c.suggestedGrade
  return g ? normalizeGrade(g) : null
}
export const isOverride = (c: ServerChild): boolean => !!(c.extras && typeof c.extras.gradeOverride === 'string' && c.extras.gradeOverride)

/** Nickname, or "Child 1", "Child 2"… by position in the list. */
export function nameOf(c: ServerChild, list: ServerChild[]): string {
  const n = (c.nickname || '').trim()
  if (n) return n
  const i = list.findIndex((x) => x.childID === c.childID)
  return `Child ${(i < 0 ? list.length : i) + 1}`
}

/** Shape used by the cost maths. null when the child has no grade yet (never guess a grade). */
export function toCostChild(c: ServerChild, list: ServerChild[], schoolName?: string): Child | null {
  const grade = gradeOf(c)
  if (!grade) return null
  const on = c.extras && c.extras.on && typeof c.extras.on === 'object' ? c.extras.on : {}
  return { id: String(c.childID), name: nameOf(c, list), grade, schoolID: c.targetSchoolID, schoolName, on }
}

// ── birth month / year pickers (we only keep month and year) ──
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })
export const MONTH_NAMES: string[] = Array.from({ length: 12 }, (_, i) => monthFmt.format(new Date(Date.UTC(2000, i, 1))))
const yearFmt = new Intl.NumberFormat('en-GB', { useGrouping: false })
export const yearLabel = (y: string | number): string => yearFmt.format(Number(y))

/** This year back 20 years, plus the saved year if it is outside that range. */
export function yearOptions(saved?: string): string[] {
  const y = new Date().getFullYear()
  const list = Array.from({ length: 21 }, (_, i) => String(y - i))
  return saved && !list.includes(saved) ? [...list, saved].sort((a, b) => Number(b) - Number(a)) : list
}
export function splitBirth(bm: string | null): { year: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(bm || '')
  return m ? { year: m[1], month: String(Number(m[2])) } : { year: '', month: '' }
}
export const joinBirth = (year: string, month: string): string | null => (year && month ? `${year}-${month.padStart(2, '0')}` : null)

export const isKnownGrade = (g: string): boolean => GRADE_ORDER.includes(normalizeGrade(g))

export function useChildren(enabled: boolean) {
  const [children, setChildren] = useState<ServerChild[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [gradeRuleConfirmed, setConfirmed] = useState(false)
  const [maxChildren, setMax] = useState(10)

  const reload = useCallback(async () => {
    if (!enabled) { setChildren([]); setLoaded(false); setError(''); return }
    try {
      const res = await childrenAPI.list()
      if (res.success && res.data) {
        setChildren(res.data.children || [])
        setAcademicYear(res.data.academicYear || '')
        setConfirmed(!!res.data.gradeRuleConfirmed)
        setMax(Number(res.data.maxChildren) || 10)
        setError('')
      } else {
        setError(res.message || 'Could not load your children. Try again.')
      }
    } catch {
      setError('Could not load your children. Try again.')
    } finally {
      setLoaded(true)
    }
  }, [enabled])

  useEffect(() => { reload() }, [reload])

  const create = async (p: ChildPayload): Promise<Result<ServerChild>> => {
    const r = await call(() => childrenAPI.create(p), 'Could not add the child. Try again.')
    if (!r.ok) return r
    const child = r.data.child
    setChildren((prev) => [...prev, child])
    return { ok: true, data: child }
  }

  const update = async (id: number, p: ChildPayload): Promise<Result<ChildSaved>> => {
    const r = await call(() => childrenAPI.update(id, p), 'Could not save. Try again.')
    if (r.ok && r.data.child) setChildren((prev) => prev.map((c) => (c.childID === id ? r.data.child : c)))
    return r
  }

  const remove = async (id: number): Promise<Result<unknown>> => {
    const r = await call(() => childrenAPI.remove(id), 'Could not remove. Try again.')
    if (r.ok) setChildren((prev) => prev.filter((c) => c.childID !== id))
    return r
  }

  const importDevice = async (items: ImportItem[]): Promise<Result<ImportResult>> => {
    const r = await call(() => childrenAPI.importDevice(items), 'Could not add them to your account. Try again.')
    if (r.ok) await reload()
    return r
  }

  return { children, loaded, error, academicYear, gradeRuleConfirmed, maxChildren, reload, create, update, remove, importDevice }
}

export type ChildrenState = ReturnType<typeof useChildren>
