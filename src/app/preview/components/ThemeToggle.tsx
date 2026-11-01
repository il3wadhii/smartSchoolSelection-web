'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Look, readLook, applyLook, onLook } from '../lib/look'

// Day / Night switch in the header. Keeps the choice for this browser.
export default function ThemeToggle() {
  const [look, setLook] = useState<Look>('day')
  useEffect(() => { setLook(readLook()); return onLook(setLook) }, [])
  const next: Look = look === 'day' ? 'night' : 'day'
  return (
    <button
      type="button"
      className="prev-theme"
      onClick={() => { setLook(next); applyLook(next) }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      data-look={look}
    >
      <span className="knob" aria-hidden="true">{look === 'day' ? <Sun size={14} /> : <Moon size={14} />}</span>
      <span className="lbl">{look === 'day' ? 'Day' : 'Night'}</span>
    </button>
  )
}
