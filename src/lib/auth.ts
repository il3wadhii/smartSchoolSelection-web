import Cookies from 'js-cookie'
import { User } from '@/types'

// Cookie-based session, same pattern as the schools portal but with
// user_* cookie names so the two sites never clash.
export const auth = {
  setAuth: (token: string, user: User) => {
    // `secure` must follow the ACTUAL page protocol, not the build mode:
    // browsers drop secure cookies served over plain HTTP, which would silently
    // discard the login token (the site currently runs on http://, no SSL yet).
    // This stays false on http and auto-tightens to true once HTTPS is added.
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const options = {
      expires: 30,
      secure: isHttps,
      sameSite: 'strict' as const,
    }
    Cookies.set('user_token', token, options)
    Cookies.set('user_user', JSON.stringify(user), options)
  },

  getToken: (): string | undefined => Cookies.get('user_token'),

  getUser: (): User | null => {
    const userCookie = Cookies.get('user_user')
    if (!userCookie) return null
    try {
      return JSON.parse(userCookie)
    } catch {
      return null
    }
  },

  isAuthenticated: (): boolean => !!(auth.getToken() && auth.getUser()),

  clearAuth: () => {
    Cookies.remove('user_token')
    Cookies.remove('user_user')
  },
}
