'use client'

import { useEffect, useState } from 'react'
import { getImageUrl } from '@/lib/api'
import { School } from '@/types'

// Hero centrepiece: cross-fades through the real school logos one at a time
// (logo only, no names). All logos are rendered stacked + preloaded so the
// fade is smooth; only the active one is visible.
export default function LogoCycler({ schools }: { schools: School[] }) {
  const logos = schools
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
