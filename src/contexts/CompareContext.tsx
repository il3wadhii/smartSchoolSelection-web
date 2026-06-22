'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// Schools selected for comparison, persisted in localStorage so the
// selection survives navigation (mirrors the app's compare flow).
const STORAGE_KEY = 'compare_school_ids'
const MAX_COMPARE = 4

interface CompareContextType {
  compareIds: number[]
  toggleCompare: (schoolId: number) => void
  removeCompare: (schoolId: number) => void
  clearCompare: () => void
  isCompared: (schoolId: number) => boolean
  maxReached: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCompareIds(JSON.parse(saved))
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  const persist = (ids: number[]) => {
    setCompareIds(ids)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* storage full/blocked — selection still works in-memory */
    }
  }

  const toggleCompare = (schoolId: number) => {
    if (compareIds.includes(schoolId)) {
      persist(compareIds.filter((id) => id !== schoolId))
    } else if (compareIds.length < MAX_COMPARE) {
      persist([...compareIds, schoolId])
    }
  }

  const removeCompare = (schoolId: number) =>
    persist(compareIds.filter((id) => id !== schoolId))

  const clearCompare = () => persist([])

  const isCompared = (schoolId: number) => compareIds.includes(schoolId)

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        toggleCompare,
        removeCompare,
        clearCompare,
        isCompared,
        maxReached: compareIds.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}
