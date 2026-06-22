'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSaved } from '@/contexts/SavedContext'
import { schoolsAPI } from '@/lib/api'
import { School } from '@/types'
import PrevSchoolCard from '../components/PrevSchoolCard'
import { Heart } from 'lucide-react'

export default function PreviewSaved() {
  const { savedIds } = useSaved()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await schoolsAPI.list(1, 200)
        if (!cancelled && res.success && res.data) setSchools(res.data.schools || [])
      } catch {
        /* prototype */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const saved = useMemo(() => schools.filter((s) => savedIds.includes(s.schoolID)), [schools, savedIds])

  if (loading) {
    return <div className="prev-c"><div className="prev-spinner" /></div>
  }

  return (
    <section className="prev-section" style={{ paddingTop: 26 }}>
      <div className="prev-c">
        <h2 className="prev-h2">Your <span className="u">shortlist</span></h2>
        {saved.length === 0 ? (
          <div className="prev-stub">
            <span className="ic"><Heart size={30} /></span>
            <h3 className="ff" style={{ fontSize: 18, fontWeight: 700 }}>Nothing saved yet</h3>
            <p className="prev-sub">Tap the heart on any school to build your shortlist.</p>
            <Link href="/preview#schools" className="btnT">Browse schools</Link>
          </div>
        ) : (
          <>
            <p className="prev-sub" style={{ marginBottom: 22 }}>{saved.length} school{saved.length === 1 ? '' : 's'} saved</p>
            <div className="prev-sgrid">
              {saved.map((s) => <PrevSchoolCard key={s.schoolID} s={s} />)}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
