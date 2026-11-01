'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { Look, readLook, applyLook } from '../lib/look'

// Floating test switch (bottom-left) between the current design and the three
// skyline looks. Remove once a look is chosen.
const LABELS: Record<Look, string> = { current: 'Current', dusk: '1 Dusk', night: '2 Night', paper: '3 Paper' }

export default function LookSwitcher() {
  const [look, setLook] = useState<Look>('current')
  useLayoutEffect(() => { const l = readLook(); setLook(l); applyLook(l) }, [])
  // Once the hero has scrolled away, the header drops its sky tint so it stays
  // readable over the page body (only matters in the skyline looks).
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector<HTMLElement>('.prev-hero')
      const header = document.querySelector<HTMLElement>('.prev-header')
      if (!hero || !header) return
      header.classList.toggle('scrolled', window.scrollY > hero.offsetHeight - 90)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const pick = (l: Look) => { setLook(l); applyLook(l) }
  return (
    <div className="prev-lookswitch" role="group" aria-label="Design look (test)">
      <span className="lbl">Look</span>
      {(Object.keys(LABELS) as Look[]).map((l) => (
        <button key={l} type="button" className={look === l ? 'on' : ''} onClick={() => pick(l)} aria-pressed={look === l}>
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
