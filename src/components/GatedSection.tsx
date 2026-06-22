'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

// Shown in place of fees / seat availability for anonymous visitors.
// The data itself never reaches the browser — the API strips it server-side.
export default function GatedSection({ what = 'this information' }: { what?: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary-200 bg-primary-100/40 p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
        <Lock className="h-6 w-6 text-primary-600" />
      </div>
      <h3 className="text-secondary-900 font-semibold mb-1">
        Create a free account to see {what}
      </h3>
      <p className="text-sm text-secondary-500 mb-4">
        Fees and live seat availability are available to registered members — signing up takes a minute.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/signup" className="btn-primary text-sm">
          Sign up free
        </Link>
        <Link href="/login" className="btn-outline text-sm">
          Log in
        </Link>
      </div>
    </div>
  )
}
