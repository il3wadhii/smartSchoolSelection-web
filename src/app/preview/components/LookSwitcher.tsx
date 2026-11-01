'use client'

import { useLayoutEffect, useState } from 'react'
import { Look, readLook, applyLook } from '../lib/look'

// Floating test switch (bottom-left) between the current design and the three
// skyline looks. Remove once a look is chosen.
const LABELS: Record<Look, string> = { current: 'Current', dusk: '1 Dusk', night: '2 Night', paper: '3 Paper', neon: '4 Neon' }

export default function LookSwitcher() {
  const [look, setLook] = useState<Look>('current')
  useLayoutEffect(() => { const l = readLook(); setLook(l); applyLook(l) }, [])
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
