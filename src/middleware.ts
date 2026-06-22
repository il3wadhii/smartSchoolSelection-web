import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that require a logged-in user. Browsing (/ and /schools/*) is public.
const PROTECTED_PREFIXES = ['/profile', '/my-reviews', '/compare']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get('user_token')

    if (!token || token.value.split('.').length !== 3) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/my-reviews/:path*', '/compare/:path*'],
}
