'use client'

import Link from 'next/link'
import { getImageUrl } from '@/lib/api'
import { School } from '@/types'
import { schoolStages, STAGE_LABEL, StageKey } from '@/lib/stages'
import SaveHeart from './SaveHeart'
import { Star, Check, ArrowRight, MapPin } from 'lucide-react'

const STAGE_DOT: Record<StageKey, string> = {
  nur: '#F4961E', kg: '#5DCAA5', pri: '#1F8A78', int: '#3E7CB1', high: '#155E51',
}

// "Letter poster" card: full-bleed brand gradient with the school's own logo
// blended into the background as watermark art (grayscale + multiply so
// white-box logos melt into the poster). Cards cycle the three logo colors.
export default function PrevSchoolCard({ s }: { s: School }) {
  const logo = getImageUrl(s.schoolImgURL)
  const stages = schoolStages(s['Educational Stage'])
  const rating = s.rating && s.rating > 0 ? Number(s.rating).toFixed(1) : null

  return (
    <Link href={`/preview/schools/${s.schoolID}`} className="prev-lp">
      <div className="wm" aria-hidden="true">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" loading="lazy" />
        ) : (
          <span className="big">{(s.schoolName || 'S').trim()[0].toUpperCase()}</span>
        )}
      </div>

      <SaveHeart id={s.schoolID} />
      <div className="top">
        {rating && <span className="rateB"><Star size={12} fill="currentColor" /> {rating}</span>}
        {s.seatsPublished && <span className="seatB"><Check size={12} /> Seats</span>}
      </div>

      <div className="base">
        <div className="bar" />
        <h3 className="nm">{s.schoolName}</h3>
        <div className="meta"><MapPin size={13} /> {s.Area}{s.system ? ` · ${s.system}` : ''}</div>
        {stages.length > 0 && (
          <div className="chips">
            {stages.map((k) => (
              <span key={k} className="tg"><i style={{ background: STAGE_DOT[k] }} />{STAGE_LABEL[k]}</span>
            ))}
          </div>
        )}
        <span className="view">View school <ArrowRight size={15} /></span>
      </div>
    </Link>
  )
}
