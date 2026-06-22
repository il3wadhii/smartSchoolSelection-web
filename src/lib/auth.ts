import Cookies from 'js-cookie'
import { User } from '@/types'

// Cookie-based session, same pattern as the schools portal but with
// user_* cookie names so the two sites never clash.
export const auth = {
  setAuth: (token: string, user: User) => {
    const options = {
      expires: 30,
      secure: process.env.NODE_ENV === 'production',
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
