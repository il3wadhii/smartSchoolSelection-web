'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// The parent's shortlist ("Saved" hearts), persisted in localStorage —
// same pattern as CompareContext.
const STORAGE_KEY = 'saved_school_ids'

interface SavedContextType {
  savedIds: number[]
  toggleSaved: (schoolId: number) => boolean // returns new state (true = now saved)
  isSaved: (schoolId: number) => boolean
}

const SavedContext = createContext<SavedContextType | undefined>(undefined)

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSavedIds(JSON.parse(saved))
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  const persist = (ids: number[]) => {
    setSavedIds(ids)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* storage blocked — works in-memory */
    }
  }

  const toggleSaved = (schoolId: number): boolean => {
    if (savedIds.includes(schoolId)) {
      persist(savedIds.filter((id) => id !== schoolId))
      return false
    }
    persist([...savedIds, schoolId])
    return true
  }

  const isSaved = (schoolId: number) => savedIds.includes(schoolId)

  return (
    <SavedContext.Provider value={{ savedIds, toggleSaved, isSaved }}>
      {children}
    </SavedContext.Provider>
  )
}

export function useSaved() {
  const context = useContext(SavedContext)
  if (context === undefined) {
    throw new Error('useSaved must be used within a SavedProvider')
  }
  return context
}
