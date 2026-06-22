'use client'

import { Star } from 'lucide-react'

interface RatingStarsProps {
  value: number
  size?: number
  // When onChange is provided, the stars become an input
  onChange?: (value: number) => void
}

export default function RatingStars({ value, size = 16, onChange }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        const StarEl = (
          <Star
            size={size}
            className={filled ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}
          />
        )
        return onChange ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 hover:scale-110 transition-transform"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            {StarEl}
          </button>
        ) : (
          <span key={star}>{StarEl}</span>
        )
      })}
    </div>
  )
}
