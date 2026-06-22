'use client'

import { useSaved } from '@/contexts/SavedContext'
import { Heart } from 'lucide-react'

export default function SaveHeart({ id }: { id: number }) {
  const { isSaved, toggleSaved } = useSaved()
  const saved = isSaved(id)
  return (
    <button
      type="button"
      className={`prev-heart ${saved ? 'on' : ''}`}
      aria-label={saved ? 'Remove from saved' : 'Save school'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(id) }}
    >
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
