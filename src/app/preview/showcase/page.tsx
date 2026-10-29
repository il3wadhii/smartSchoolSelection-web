'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { schoolsAPI } from '@/lib/api'
import { School } from '@/types'
import OrbitStage from '../components/OrbitStage'
import { ArrowRight, MapPin, GraduationCap, Star, HandCoins } from 'lucide-react'

// Eased count-up for the stats row; snaps straight to the target when the
// user prefers reduced motion.
function useCountUp(target: number, ms = 1400) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

const H1_WORDS = ['The', 'smart', 'way', 'to', 'find', 'the']

export default function PreviewShowcase() {
  const [schools, setSchools] = useState<School[]>([])
  const [totals, setTotals] = useState<{ schools: number; reviews: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [list, filters] = await Promise.all([schoolsAPI.list(1, 200), schoolsAPI.filters()])
        if (list.success && list.data?.schools) setSchools(list.data.schools)
        if (filters.success && filters.data?.totals) setTotals(filters.data.totals)
      } catch {
        /* showcase still renders without data */
      }
    })()
  }, [])

  const nSchools = useCountUp(totals?.schools ?? 39)
  const nReviews = useCountUp(totals?.reviews ?? 210)
  const nStages = useCountUp(5)
  const nFree = useCountUp(100)

  return (
    <div className="prev-show">
      <span className="prev-show-chip">Test view · preview only</span>

      {/* ── Orbit stage: brand logo with the real school logos circling it ── */}
      <OrbitStage schools={schools} />

      {/* ── Staggered headline with the brand underline ── */}
      <h1 className="prev-show-h1">
        {H1_WORDS.map((w, i) => (
          <span key={i} className="w" style={{ ['--i' as never]: i }}>{w}&nbsp;</span>
        ))}
        <span className="w hl" style={{ ['--i' as never]: H1_WORDS.length }}>best school</span>
        <span className="w" style={{ ['--i' as never]: H1_WORDS.length + 1 }}>&nbsp;in Kuwait</span>
      </h1>
      <p className="prev-show-sub">
        Every preschool, KG and school — fees, curricula, live seats and real parent reviews. In one place.
      </p>

      {/* ── Live stats ── */}
      <div className="prev-show-stats">
        <div className="st" style={{ ['--i' as never]: 0 }}>
          <span className="ic"><GraduationCap size={20} /></span>
          <b>{nSchools}+</b><small>schools listed</small>
        </div>
        <div className="st" style={{ ['--i' as never]: 1 }}>
          <span className="ic" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><Star size={20} /></span>
          <b>{nReviews}+</b><small>parent reviews</small>
        </div>
        <div className="st" style={{ ['--i' as never]: 2 }}>
          <span className="ic"><MapPin size={20} /></span>
          <b>{nStages}</b><small>stages covered</small>
        </div>
        <div className="st" style={{ ['--i' as never]: 3 }}>
          <span className="ic" style={{ background: 'var(--otint)', color: 'var(--oranged)' }}><HandCoins size={20} /></span>
          <b>{nFree}%</b><small>free for parents</small>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="prev-show-cta">
        <Link href="/preview#schools" className="btnT">Explore schools <ArrowRight size={16} /></Link>
        <Link href="/preview/map" className="btnO">Open the map</Link>
      </div>
    </div>
  )
}
