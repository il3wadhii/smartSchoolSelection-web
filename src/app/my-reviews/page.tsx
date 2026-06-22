'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { userAPI, ratingsAPI } from '@/lib/api'
import { Rating } from '@/types'
import RatingStars from '@/components/RatingStars'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Star, Pencil, Trash2, X } from 'lucide-react'

export default function MyReviewsPage() {
  const { toasts, addToast, removeToast } = useToast()
  const [reviews, setReviews] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.myReviews()
        if (res.success && res.data) setReviews(res.data.reviews || [])
      } catch {
        addToast({ type: 'error', title: 'Failed to load your reviews' })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startEdit = (review: Rating) => {
    setEditingId(review.ratingID)
    setEditRating(review.rating)
    setEditComment(review.comment || '')
  }

  const saveEdit = async () => {
    if (editingId === null) return
    setSaving(true)
    try {
      const res = await ratingsAPI.update(editingId, editRating, editComment)
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.ratingID === editingId ? { ...r, rating: editRating, comment: editComment } : r
          )
        )
        setEditingId(null)
        addToast({ type: 'success', title: 'Review updated' })
      } else {
        addToast({ type: 'error', title: 'Update failed', message: res.message })
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update failed', message: err.response?.data?.message })
    } finally {
      setSaving(false)
    }
  }

  const deleteReview = async (review: Rating) => {
    if (!window.confirm(`Delete your review of ${review.schoolName}?`)) return
    try {
      const res = await ratingsAPI.remove(review.ratingID)
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.ratingID !== review.ratingID))
        addToast({ type: 'success', title: 'Review deleted' })
      } else {
        addToast({ type: 'error', title: 'Delete failed', message: res.message })
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete failed', message: err.response?.data?.message })
    }
  }

  if (loading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <h1 className="text-xl font-bold text-secondary-900 mb-6">
        My reviews <span className="text-secondary-300">({reviews.length})</span>
      </h1>

      {reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <Star className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-600 font-medium">You haven&apos;t written any reviews yet</p>
          <p className="text-secondary-400 text-sm mt-1 mb-5">
            Visit a school page and share your experience with other parents.
          </p>
          <Link href="/" className="btn-primary text-sm">Browse schools</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.ratingID} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <Link
                  href={`/schools/${review.schoolID}`}
                  className="font-semibold text-secondary-900 hover:text-primary-600"
                >
                  {review.schoolName}
                </Link>
                {editingId !== review.ratingID && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(review)}
                      className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-100 rounded"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteReview(review)}
                      className="p-1.5 text-secondary-400 hover:text-accent-600 hover:bg-accent-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {editingId === review.ratingID ? (
                <div className="space-y-3">
                  <RatingStars value={editRating} size={24} onChange={setEditRating} />
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="btn-primary text-sm">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-outline text-sm inline-flex items-center gap-1"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <RatingStars value={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-secondary-600 mt-2 whitespace-pre-wrap">{review.comment}</p>
                  )}
                  {review.createdOn && (
                    <p className="text-xs text-secondary-300 mt-2">
                      {new Date(review.createdOn).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
