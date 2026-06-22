'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { School } from '@/types'
import { getImageUrl } from '@/lib/api'
import { schoolStages } from '@/lib/stages'
import { useCompare } from '@/contexts/CompareContext'
import { useSaved } from '@/contexts/SavedContext'
import StageLine from '@/components/StageLine'
import { Heart, Plus, Check, MapPin, Lock, BadgeCheck } from 'lucide-react'

// Soft tile colors for the monogram fallback (per prototype)
const TILE_COLORS = ['#FDEBD7', '#FFF3D6', '#E2EFF9', '#E7F4EF', '#EDE7F9', '#FBE5E0', '#FFF0E0']

export function SchoolLogo({
  school,
  size = 50,
  radius = 14,
  fontSize = 15,
}: {
  school: Pick<School, 'schoolID' | 'schoolName' | 'schoolImgURL'>
  size?: number
  radius?: number
  fontSize?: number
}) {
  const img = getImageUrl(school.schoolImgURL)
  const tile = TILE_COLORS[school.schoolID % TILE_COLORS.length]
  const initials = school.schoolName
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div
      className="flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: tile }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={`${school.schoolName} logo`} className="w-full h-full object-contain" />
      ) : (
        <span
          className="font-serif font-bold text-primary-600 tracking-[.02em]"
          style={{ fontSize }}
        >
          {initials || 'S'}
        </span>
      )}
    </div>
  )
}

interface SchoolCardProps {
  school: School
  isAuthenticated: boolean
  distanceKm?: number | null
  onToast?: (message: string) => void
}

export default function SchoolCard({ school, isAuthenticated, distanceKm, onToast }: SchoolCardProps) {
  const router = useRouter()
  const { isCompared, toggleCompare, maxReached } = useCompare()
  const { isSaved, toggleSaved } = useSaved()
  const inCompare = isCompared(school.schoolID)
  const saved = isSaved(school.schoolID)
  const stages = schoolStages(school['Educational Stage'])

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nowSaved = toggleSaved(school.schoolID)
    onToast?.(nowSaved ? 'Saved to your shortlist' : 'Removed from saved')
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!inCompare && maxReached) {
      onToast?.('Compare up to 4 schools')
      return
    }
    toggleCompare(school.schoolID)
    onToast?.(inCompare ? 'Removed from compare' : 'Added to compare')
  }

  return (
    <div
      className="card overflow-hidden cursor-pointer transition-shadow hover:shadow-finder"
      onClick={() => router.push(`/schools/${school.schoolID}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/schools/${school.schoolID}`)}
    >
      {/* Top: logo + name + rating */}
      <div className="px-[18px] pt-4 flex gap-[13px] items-start">
        <SchoolLogo school={school} />
        <div className="flex-1 min-w-0">
          <div className="font-serif font-semibold text-base leading-[1.3] text-ink">
            {school.schoolName}
          </div>
          <div className="text-[12.5px] text-muted font-semibold mt-[3px] flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {school.Area} · {school.system}
            {distanceKm !== null && distanceKm !== undefined ? ` · ${distanceKm} km` : ''}
          </div>
          {school.seatsPublished && (
            <span className="badge-verified mt-1.5">
              <BadgeCheck className="h-3 w-3" /> Seats updated
            </span>
          )}
        </div>
        {(school.reviewCount ?? 0) > 0 && (
          <span className="rate-chip">★ {school.rating}</span>
        )}
      </div>

      {/* Stage line */}
      <div className="px-[18px] mt-2.5">
        <StageLine stages={stages} />
      </div>

      {/* Footer: fee-from + actions */}
      <div className="flex items-center border-t border-line mt-3.5">
        <div className="flex-1 px-[18px] py-[11px]">
          {isAuthenticated ? (
            school.fees ? (
              <>
                <div className="font-extrabold text-[14.5px] text-primary-600">
                  KD {Number(school.fees).toLocaleString()}
                  <span className="font-semibold text-muted text-[11.5px]">/yr</span>
                </div>
                <div className="text-[10.5px] text-muted font-bold uppercase tracking-[.05em]">
                  from · {school.reviewCount ?? 0} review{(school.reviewCount ?? 0) === 1 ? '' : 's'}
                </div>
              </>
            ) : (
              <div className="text-[11.5px] text-muted font-bold uppercase tracking-[.05em]">
                Fees not published · {school.reviewCount ?? 0} reviews
              </div>
            )
          ) : (
            <Link
              href="/signup"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-primary-600 hover:underline"
            >
              <Lock className="h-3.5 w-3.5" /> Free account shows fees &amp; seats
            </Link>
          )}
        </div>
        <div className="flex gap-2 pr-3.5">
          <button
            onClick={handleSave}
            aria-label={saved ? 'Remove from saved' : 'Save school'}
            className={`h-[38px] w-[38px] rounded-[12px] border-[1.5px] flex items-center justify-center transition-colors ${
              saved ? 'bg-accent-100 border-accent-300 text-accent-500' : 'bg-white border-line text-muted hover:border-accent-300'
            }`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompare}
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
            className={`h-[38px] w-[38px] rounded-[12px] border-[1.5px] flex items-center justify-center transition-colors ${
              inCompare ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-line text-muted hover:border-primary-400'
            }`}
          >
            {inCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
