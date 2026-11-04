'use client'
// Seat alerts for the signed-in parent: load once, toggle per (school, grade).
import { useCallback, useEffect, useState } from 'react'
import { SeatAlert, seatAlertsAPI } from '@/lib/api'

const GRADES = ['Preschool', 'KG1', 'KG2', ...Array.from({ length: 13 }, (_, i) => `Grade ${i + 1}`)]

/** Same rule as the API: "grade 3 " → "Grade 3"; null when unknown. */
export function normGrade(raw: string): string | null {
  const t = String(raw || '').trim().replace(/\s+/g, ' ').toLowerCase()
  return GRADES.find((g) => g.toLowerCase() === t) || null
}

export function useSeatAlerts(enabled: boolean) {
  const [alerts, setAlerts] = useState<SeatAlert[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!enabled) { setAlerts([]); return }
    try {
      const res = await seatAlertsAPI.list()
      if (res.success && res.data) setAlerts(res.data.alerts || [])
    } catch { /* leave the list as it was */ }
  }, [enabled])

  useEffect(() => { reload() }, [reload])

  const find = (schoolID: number, grade: string) => {
    const g = normGrade(grade)
    return alerts.find((a) => a.schoolID === schoolID && a.grade === g && a.isActive)
  }

  const toggle = async (schoolID: number, grade: string) => {
    const key = `${schoolID}:${grade}`
    setBusy(key); setError('')
    try {
      const on = find(schoolID, grade)
      if (on) await seatAlertsAPI.remove(on.alertID)
      else await seatAlertsAPI.add(schoolID, grade)
      await reload()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save the alert. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (alertID: number) => {
    setBusy(`id:${alertID}`)
    try { await seatAlertsAPI.remove(alertID); await reload() } finally { setBusy(null) }
  }

  return { alerts, find, toggle, remove, busy, error }
}
