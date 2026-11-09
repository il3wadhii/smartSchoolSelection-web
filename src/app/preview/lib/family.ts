// The parent's children for the family cost plan. Saved in this browser
// (localStorage) — same shape as the app, which keeps them on the phone.
// Signed-in parents now keep children on their account (see ./children.ts);
// this file still reads the old device list so it can be offered for import.
import { schoolsAPI } from '@/lib/api'
import { Child, SchoolCostInfo } from './cost'

const KEY = 'family_children_v1'
const SNOOZE_KEY = 'family_import_snooze_v1'
const EVT = 'ssc-family-change'
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000

export function loadChildren(): Child[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as Child[]) : []
    return Array.isArray(list) ? list.map((c) => ({ ...c, on: c.on || {} })) : []
  } catch {
    return []
  }
}

export function saveChildren(children: Child[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(children))
    window.dispatchEvent(new Event(EVT))
  } catch {
    /* storage blocked — the plan still works for this visit */
  }
}

/** Forget the device-only children once they are safely on the account. */
export function clearDeviceChildren(): void {
  try {
    localStorage.removeItem(KEY)
    window.dispatchEvent(new Event(EVT))
  } catch {
    /* storage blocked */
  }
}

/** "Not now" on the import card hides it for 30 days. */
export function importSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY)) > Date.now()
  } catch {
    return false
  }
}
export function snoozeImport(): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
  } catch {
    /* storage blocked */
  }
}

/** Re-read when another tab or page changes the plan. */
export function onChildrenChange(cb: () => void): () => void {
  const h = (e: Event) => { if (!(e instanceof StorageEvent) || e.key === KEY) cb() }
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => { window.removeEventListener(EVT, h); window.removeEventListener('storage', h) }
}

export const newChildId = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Cost info for one school; null when fees are hidden (not signed in). */
export async function fetchCostInfo(schoolID: number): Promise<SchoolCostInfo | null> {
  try {
    const res = await schoolsAPI.detail(schoolID)
    const d = res?.data
    if (!res?.success || !d || !d.gradeFees) return null
    return toCostInfo(d)
  } catch {
    return null
  }
}

export function toCostInfo(d: any): SchoolCostInfo {
  return {
    schoolID: d.schoolID,
    schoolName: d.schoolName,
    gradeFees: d.gradeFees || [],
    extraFees: d.extraFees || [],
    siblingDiscountPct: Number(d.siblingDiscountPct) || 0,
  }
}
