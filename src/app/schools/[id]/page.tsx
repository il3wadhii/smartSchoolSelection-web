'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { schoolsAPI } from '@/lib/api'
import { schoolStages, feesByStageGroups, StageKey } from '@/lib/stages'
import { SchoolDetails, Rating, RatingStatistics } from '@/types'
import { useCompare } from '@/contexts/CompareContext'
import { useSaved } from '@/contexts/SavedContext'
import StageLine from '@/components/StageLine'
import { SchoolLogo } from '@/components/SchoolCard'
import RatingStars from '@/components/RatingStars'
import GatedSection from '@/components/GatedSection'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import {
  ArrowLeft, MapPin, Phone, Globe, Lock, Heart, Check, Plus, BadgeCheck, ExternalLink, ChevronDown,
} from 'lucide-react'

function FactCell({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="card rounded-2xl px-3.5 py-[13px]">
      <div className="text-[10.5px] text-muted font-extrabold uppercase tracking-[.05em]">{k}</div>
      <div className="font-extrabold text-[14.5px] mt-[3px] text-primary-600">{v}</div>
    </div>
  )
}

const LockedValue = () => (
  <Link href="/signup" className="inline-flex items-center gap-1 text-primary-600 hover:underline text-[13px]">
    <Lock className="h-3.5 w-3.5" /> Account
  </Link>
)

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const schoolId = parseInt(id)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const toast = (title: string) => addToast({ type: 'info', title })
  const { isCompared, toggleCompare, maxReached } = useCompare()
  const { isSaved, toggleSaved } = useSaved()

  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [reviews, setReviews] = useState<Rating[]>([])
  const [statistics, setStatistics] = useState<RatingStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (authLoading || isNaN(schoolId)) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [detailRes, ratingsRes] = await Promise.all([
          schoolsAPI.detail(schoolId),
          schoolsAPI.ratings(schoolId),
        ])
        if (cancelled) return
        if (detailRes.success && detailRes.data) setSchool(detailRes.data)
        if (ratingsRes.success && ratingsRes.data) {
          setReviews(ratingsRes.data.reviews || [])
          setStatistics(ratingsRes.data.statistics || null)
        }
      } catch {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load school' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, isAuthenticated, authLoading])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (myRating === 0) {
      addToast({ type: 'warning', title: 'Please choose a star rating' })
      return
    }
    setSubmitting(true)
    try {
      const res = await schoolsAPI.addRating(schoolId, myRating, myComment)
      if (res.success) {
        toast('Review submitted — thank you!')
        setMyRating(0)
        setMyComment('')
        const ratingsRes = await schoolsAPI.ratings(schoolId)
        if (ratingsRes.success && ratingsRes.data) {
          setReviews(ratingsRes.data.reviews || [])
          setStatistics(ratingsRes.data.statistics || null)
        }
      } else {
        addToast({ type: 'error', title: 'Could not submit review', message: res.message })
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Could not submit review', message: err.response?.data?.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!school) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-muted font-semibold mb-4">School not found.</p>
        <Link href="/" className="btn-cta max-w-xs mx-auto">Back to schools</Link>
      </div>
    )
  }

  const stages = schoolStages(school['Educational Stage'])
  const stageFeeGroups = feesByStageGroups(school.gradeFees)
  const inCompare = isCompared(school.schoolID)
  const saved = isSaved(school.schoolID)
  const seats = school.totalAvailableSeats
  const lat = school.location?.latitude
  const lng = school.location?.longitude
  const mapsEmbed = lat && lng ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` : null

  const highlights = [
    ...(school.languages ? school.languages.split(/[-,/]/).map((l) => l.trim()).filter(Boolean) : []),
    school.coedStatus,
    school['Educational Stage'],
    school['Number of Student in class'] ? `~${school['Number of Student in class']} per class` : null,
  ].filter(Boolean) as string[]

  return (
    <div className="pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-white border-b border-line px-6 py-[22px]">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-3.5 items-center mt-4">
            <SchoolLogo school={school} size={58} radius={16} fontSize={18} />
            <div className="min-w-0">
              <h1 className="font-serif text-xl font-semibold leading-[1.3]">{school.schoolName}</h1>
              <div className="text-[12.5px] text-muted font-semibold mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {school.Area}, Kuwait · {school.system} curriculum
              </div>
              {school.availability && school.availability.length > 0 && (
                <span className="badge-verified mt-1.5">
                  <BadgeCheck className="h-3 w-3" /> Seats updated
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <StageLine stages={stages} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* Facts grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4">
          <FactCell
            k="Parent rating"
            v={
              school.rating && Number(school.rating.average) > 0
                ? `★ ${school.rating.average} · ${school.rating.totalReviews} reviews`
                : 'No reviews yet'
            }
          />
          <FactCell k="Students per class" v={school['Number of Student in class'] || '—'} />
          <FactCell
            k="Fees from"
            v={
              isAuthenticated ? (
                school.gradeFees && school.gradeFees.length ? (
                  `KD ${Math.min(...school.gradeFees.map((f) => Number(f.fees))).toLocaleString()}/yr`
                ) : (
                  '—'
                )
              ) : (
                <LockedValue />
              )
            }
          />
          <FactCell
            k="Open seats"
            v={
              isAuthenticated ? (
                seats !== null && seats !== undefined ? (
                  seats > 0 ? (
                    <span className="text-good">{seats} seats</span>
                  ) : (
                    'Full'
                  )
                ) : (
                  '—'
                )
              ) : (
                <LockedValue />
              )
            }
          />
        </div>

        {/* Fees by stage */}
        <div className="pt-5">
          <h4 className="font-serif text-[15.5px] font-semibold mb-2.5">Annual fees by stage</h4>
          {!isAuthenticated ? (
            <GatedSection what="fee details" />
          ) : stageFeeGroups.length ? (
            // Stage order: Preschool → KG → Primary → Secondary. Single-grade
            // stages render flat; multi-grade stages expand to per-grade fees.
            stageFeeGroups.map((group) => {
              const single = group.grades.length === 1
              const open = !!openStages[group.key]
              return (
                <div key={group.key} className="card rounded-chip mb-2 overflow-hidden">
                  <button
                    type="button"
                    disabled={single}
                    onClick={() => setOpenStages((s) => ({ ...s, [group.key]: !s[group.key] }))}
                    className={`w-full flex items-center justify-between px-[15px] py-3 text-[13.5px] font-bold text-left ${
                      single ? 'cursor-default' : 'hover:bg-primary-100/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {group.label}
                      {!single && (
                        <span className="text-[11px] font-bold text-muted">
                          {group.grades.length} grades
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-primary-600 font-extrabold">
                        {single ? '' : 'from '}KD {group.from.toLocaleString()}
                      </span>
                      {!single && (
                        <ChevronDown
                          className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      )}
                    </span>
                  </button>
                  {!single && open && (
                    <div className="border-t border-line">
                      {group.grades.map((g) => (
                        <div
                          key={g.grade}
                          className="flex justify-between px-[15px] py-2.5 text-[13px] font-semibold border-b border-line last:border-0"
                        >
                          <span className="text-secondary-600">{g.grade}</span>
                          <span className="text-primary-600 font-bold">KD {g.fees.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-muted text-sm font-semibold">
              No fee information published — contact the school directly.
            </p>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="pt-5">
            <h4 className="font-serif text-[15.5px] font-semibold mb-2.5">Highlights</h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h, i) => (
                <span key={i} className="card rounded-full px-[13px] py-[7px] text-[12.5px] font-bold">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2.5 pt-6">
          {school.phone ? (
            <a href={`tel:${school.phone}`} className="btn-cta text-center">
              <Phone className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Call school
            </a>
          ) : school.URL ? (
            <a
              href={school.URL.startsWith('http') ? school.URL : `https://${school.URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta text-center"
            >
              <Globe className="inline h-4 w-4 mr-1.5 -mt-0.5" /> Visit website
            </a>
          ) : null}
          <button
            onClick={() => {
              if (!inCompare && maxReached) return toast('Compare up to 4 schools')
              toggleCompare(school.schoolID)
              toast(inCompare ? 'Removed from compare' : 'Added to compare')
            }}
            className="btn-cta-alt inline-flex items-center justify-center gap-1.5"
          >
            {inCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {inCompare ? 'In compare' : 'Compare'}
          </button>
          <button
            onClick={() => {
              const nowSaved = toggleSaved(school.schoolID)
              toast(nowSaved ? 'Saved to your shortlist' : 'Removed from saved')
            }}
            aria-label={saved ? 'Remove from saved' : 'Save school'}
            className={`shrink-0 w-[52px] rounded-btn border-[1.5px] flex items-center justify-center ${
              saved ? 'bg-accent-100 border-accent-300 text-accent-500' : 'bg-white border-line text-muted'
            }`}
          >
            <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* About */}
        {school.about && (
          <div className="pt-7">
            <h4 className="font-serif text-[15.5px] font-semibold mb-2.5">About the school</h4>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">{school.about}</p>
            {school.URL && (
              <a
                href={school.URL.startsWith('http') ? school.URL : `https://${school.URL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-bold hover:underline mt-2"
              >
                <Globe className="h-4 w-4" /> Visit website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Location */}
        {mapsEmbed && (
          <div className="pt-7">
            <h4 className="font-serif text-[15.5px] font-semibold mb-2.5">Location</h4>
            <div className="card overflow-hidden">
              <iframe
                src={mapsEmbed}
                className="w-full h-[280px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${school.schoolName}`}
              />
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-[12.5px] text-muted font-semibold flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-4 w-4 text-primary-600 shrink-0" /> {school.address}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-primary-600 font-extrabold whitespace-nowrap hover:underline"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="pt-7">
          <h4 className="font-serif text-[15.5px] font-semibold mb-2.5">Parent reviews</h4>

          {statistics && statistics.totalReviews > 0 && (
            <div className="card p-5 mb-3 flex items-center gap-4">
              <span className="font-serif text-4xl font-bold">{(Number(statistics.averageRating) || 0).toFixed(1)}</span>
              <div>
                <RatingStars value={Number(statistics.averageRating) || 0} size={18} />
                <p className="text-[12.5px] text-muted font-semibold mt-1">
                  {statistics.totalReviews} review{statistics.totalReviews === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          )}

          <div className="card p-5 mb-3">
            <p className="font-bold text-sm mb-2.5">Write a review</p>
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="space-y-3">
                <RatingStars value={myRating} size={26} onChange={setMyRating} />
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows={3}
                  className="input-field resize-none font-semibold"
                  placeholder="Share your experience with this school…"
                />
                <button type="submit" disabled={submitting} className="btn-cta max-w-[200px]">
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted font-semibold">
                <Link href="/login" className="text-primary-600 font-extrabold hover:underline">Log in</Link>
                {' '}or{' '}
                <Link href="/signup" className="text-primary-600 font-extrabold hover:underline">create a free account</Link>
                {' '}to write a review.
              </p>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-center text-muted text-sm font-semibold py-4">
              No reviews yet — be the first to review this school.
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.ratingID} className="card p-4 mb-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-sm">{review.userName || 'Parent'}</p>
                  <RatingStars value={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-ink/80 whitespace-pre-wrap">{review.comment}</p>
                )}
                {review.createdOn && (
                  <p className="text-[11px] text-muted font-semibold mt-1.5">
                    {new Date(review.createdOn).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
