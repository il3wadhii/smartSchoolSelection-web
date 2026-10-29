'use client'

import { getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { BLOCKED_IMG } from './LogoCycler'

// Brand centerpiece: the site logo floating in the middle with the real
// school logos orbiting it in two slow counter-rotating rings.
// All motion is transform/opacity-only and disabled under
// prefers-reduced-motion (see .prev-show-stage rules in preview.css).
export default function OrbitStage({ schools }: { schools: School[] }) {
  const logos = schools
    .filter((s) => s.schoolImgURL && !BLOCKED_IMG.some((b) => s.schoolImgURL!.includes(b)))
    .map((s) => getImageUrl(s.schoolImgURL))
    .filter((u): u is string => !!u)

  const ring1 = logos.slice(0, 6)
  const ring2 = logos.slice(6, 18)

  return (
    <div className="prev-show-stage" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="orbit o1">
        {ring1.map((u, i) => (
          <span key={u} className="sat" style={{ ['--a' as never]: `${(i * 360) / Math.max(ring1.length, 1)}deg`, ['--r' as never]: 'var(--r1)' }}>
            <span className="tile"><img src={u} alt="" loading="lazy" /></span>
          </span>
        ))}
      </div>
      <div className="orbit o2 rev">
        {ring2.map((u, i) => (
          <span key={u} className="sat" style={{ ['--a' as never]: `${(i * 360) / Math.max(ring2.length, 1)}deg`, ['--r' as never]: 'var(--r2)' }}>
            <span className="tile"><img src={u} alt="" loading="lazy" /></span>
          </span>
        ))}
      </div>
      <span className="prev-show-logoWrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png?v=2" alt="Smart School Selection" />
      </span>
    </div>
  )
}
