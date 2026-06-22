'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useSaved } from '@/contexts/SavedContext'
import { schoolsAPI } from '@/lib/api'
import { School } from '@/types'
import SchoolCard from '@/components/SchoolCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Heart } from 'lucide-react'

export default function SavedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { savedIds } = useSaved()
  const { toasts, addToast, removeToast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await schoolsAPI.list(1, 100)
        if (!cancelled && res.success && res.data) setSchools(res.data.schools || [])
      } catch {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load schools' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated])

  const savedSchools = useMemo(
    () => schools.filter((s) => savedIds.includes(s.schoolID)),
    [schools, savedIds]
  )

  if (loading || authLoading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <h2 className="font-serif text-[21px] font-semibold">Saved</h2>
      <p className="text-muted text-[13px] font-semibold mt-1">Your shortlist</p>

      {savedSchools.length === 0 ? (
        <div className="text-center px-10 py-[70px]">
          <Heart className="h-11 w-11 mx-auto text-muted" />
          <h3 className="font-serif text-lg font-semibold mt-3">Nothing saved yet</h3>
          <p className="text-muted text-[13.5px] font-semibold mt-2 leading-[1.55]">
            Tap the heart on any school to build your shortlist.
          </p>
          <Link href="/" className="btn-cta mt-5 max-w-xs mx-auto block">
            Browse schools
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {savedSchools.map((school) => (
            <SchoolCard
              key={school.schoolID}
              school={school}
              isAuthenticated={isAuthenticated}
              onToast={(t) => addToast({ type: 'info', title: t })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
