'use client'

import { useEffect, useState } from 'react'
import { getImageUrl } from '@/lib/api'
import { School } from '@/types'

// Hero centrepiece: cross-fades through the real school logos one at a time
// (logo only, no names). All logos are rendered stacked + preloaded so the
// fade is smooth; only the active one is visible.
//
// Some source images aren't usable as a showcase: a generic "school building"
// placeholder shared by ~13 schools, and a couple of logos that were cropped
// at the edges before upload. We skip those here so the hero only cycles clean,
// complete logos. (Each school's own page still shows its own image in full.)
export const BLOCKED_IMG = [
  'umm_hani_cyxdpc',          // shared building placeholder (~12 schools)
  'ASK_tbiuyz',               // building photo (American School of Kuwait)
  'hawallly_pakistan',        // cropped logo — flagged for re-upload
  'inter_schol_of_pakistan',  // cropped logo — flagged for re-upload
]

export default function LogoCycler({ schools }: { schools: School[] }) {
  const logos = schools
    .filter((s) => s.schoolImgURL && !BLOCKED_IMG.some((b) => s.schoolImgURL!.includes(b)))
    .map((s) => getImageUrl(s.schoolImgURL))
    .filter((u): u is string => !!u)

  const [i, setI] = useState(0)

  useEffect(() => {
    if (logos.length < 2) return
    const t = setInterval(() => setI((p) => (p + 1) % logos.length), 2200)
    return () => clearInterval(t)
  }, [logos.length])

  if (!logos.length) return null

  return (
    <div className="prev-logocycle">
      <div className="tile">
        {logos.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={idx} src={src} alt="" className={idx === i ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}
