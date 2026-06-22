'use client'

import Link from 'next/link'
import { getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { schoolStages, STAGE_LABEL, StageKey } from '@/lib/stages'
import SaveHeart from './SaveHeart'
import { Star, Check } from 'lucide-react'

const STAGE_DOT: Record<StageKey, string> = {
  nur: '#F4961E', kg: '#5DCAA5', pri: '#1F8A78', int: '#3E7CB1', high: '#155E51',
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PrevSchoolCard({ s }: { s: School }) {
  const logo = getImageUrl(s.schoolImgURL)
  const stages = schoolStages(s['Educational Stage'])
  const rating = s.rating && s.rating > 0 ? Number(s.rating).toFixed(1) : null

  return (
    <Link href={`/preview/schools/${s.schoolID}`} className="prev-scard">
      <SaveHeart id={s.schoolID} />
      <div className="top">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="logo" src={logo} alt={s.schoolName} loading="lazy" />
        ) : (
          <span className="mono">{initials(s.schoolName)}</span>
        )}
        <div style={{ flex: 1, paddingRight: 28 }}>
          <div className="nm">{s.schoolName}</div>
          <div className="meta">
            {rating && (
              <><Star size={11} fill="currentColor" style={{ color: 'var(--orange)', verticalAlign: '-1px' }} /> {rating} · </>
            )}
            {s.Area}{s.system ? ` · ${s.system}` : ''}
          </div>
          {s.seatsPublished && (
            <span className="prev-seatbadge"><Check size={12} /> Seats available</span>
          )}
        </div>
      </div>
      {stages.length > 0 && (
        <div className="prev-stageline">
          {stages.map((k) => (
            <span key={k} className="prev-sd"><i style={{ background: STAGE_DOT[k] }} />{STAGE_LABEL[k]}</span>
          ))}
        </div>
      )}
    </Link>
  )
}
