import axios from 'axios'
import Cookies from 'js-cookie'
import { ApiResponse, User } from '@/types'

// Resolve the API base URL. In local/LAN development we talk to the API on the
// SAME host the page was opened from — so visiting the site from a phone at
// http://192.168.x.x:3003 reaches the API on the Mac (192.168.x.x:3001) instead
// of the phone itself. In production we use the configured/prod API URL.
function resolveApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (typeof window === 'undefined') {
    return envUrl || ''
  }
  const host = window.location.hostname
  const isLocalOrLan =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (isLocalOrLan) return `http://${host}:3001`
  // Non-local host (public tunnel): default to same-origin ('') so the Next
  // rewrite proxies /api and /uploads to the local API (one tunnel, no CORS).
  // An explicit NEXT_PUBLIC_API_URL still wins (e.g. real production).
  return envUrl || ''
}

export const API_URL = resolveApiUrl()

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the user token when present. Anonymous browsing is fine: the API
// simply omits fees/seats from responses without a token.
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('user_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// On 401 we only clear a stale session — we do NOT force-redirect, because
// most of the site is browsable logged-out. Protected pages are guarded by
// middleware.ts instead.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      if (!isLoginEndpoint && Cookies.get('user_token')) {
        Cookies.remove('user_token')
        Cookies.remove('user_user')
      }
    }
    return Promise.reject(error)
  }
)

// Resolve relative image paths (e.g. /uploads/...) against the API host
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_URL}${path}`
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string
  lastName: string
  email: string
  phone: string
  gender: string
  password: string
}

export const authAPI = {
  register: async (payload: RegisterPayload): Promise<ApiResponse> => {
    const response = await api.post('/api/auth/register', payload)
    return response.data
  },

  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  updatePassword: async (email: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/api/auth/update-password', { email, newPassword })
    return response.data
  },
}

// ─── Schools (public browse; fees/seats only when logged in) ────────────────

export const schoolsAPI = {
  list: async (page: number = 1, limit: number = 50): Promise<ApiResponse> => {
    const response = await api.get('/api/schools', { params: { page, limit } })
    return response.data
  },

  detail: async (id: number): Promise<ApiResponse> => {
    const response = await api.get(`/api/schools/${id}`)
    return response.data
  },

  filters: async (): Promise<ApiResponse> => {
    const response = await api.get('/api/schools/filters')
    return response.data
  },

  ratings: async (id: number): Promise<ApiResponse> => {
    const response = await api.get(`/api/schools/${id}/ratings`)
    return response.data
  },

  addRating: async (id: number, rating: number, comment: string): Promise<ApiResponse> => {
    const response = await api.post(`/api/schools/${id}/ratings`, { rating, comment })
    return response.data
  },

  compare: async (schoolIds: number[]): Promise<ApiResponse> => {
    const response = await api.post('/api/schools/compare', { schoolIds })
    return response.data
  },

  feesByGrade: async (id: number, grade: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/schools/${id}/fees`, { params: { grade } })
    return response.data
  },
}

// ─── User (login required) ───────────────────────────────────────────────────

export const userAPI = {
  profile: async (): Promise<ApiResponse> => {
    const response = await api.get('/api/users/profile')
    return response.data
  },

  updateProfile: async (payload: Partial<User>): Promise<ApiResponse> => {
    const response = await api.put('/api/users/profile', payload)
    return response.data
  },

  myReviews: async (): Promise<ApiResponse> => {
    const response = await api.get('/api/users/reviews')
    return response.data
  },
}

// ─── AI assistant (local LLM, grounded in school data) ──────────────────────

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  // Attached by the server for assistant replies: accurate, DB-sourced details
  // for each school mentioned, used to render a clickable table.
  schools?: AssistantSchool[]
  grade?: string | null
}

export interface AssistantSchool {
  schoolID: number
  schoolName: string
  area: string
  system: string
  distanceKm: number | null
  fees: number | null
  feeRange: { min: number; max: number } | null
  seats: number | null
  totalSeats: number | null
}

export const assistantAPI = {
  chat: async (
    message: string,
    history: AssistantMessage[] = [],
    location?: { lat: number; lng: number } | null
  ): Promise<ApiResponse<{ reply: string; schools: AssistantSchool[]; grade: string | null; isLoggedIn: boolean }>> => {
    const cleanHistory = history.map(({ role, content }) => ({ role, content }))
    const response = await api.post(
      '/api/assistant/chat',
      { message, history: cleanHistory, ...(location ? { location } : {}) },
      { timeout: 120000 }
    )
    return response.data
  },
}

export const ratingsAPI = {
  update: async (ratingId: number, rating: number, comment: string): Promise<ApiResponse> => {
    const response = await api.put(`/api/ratings/${ratingId}`, { rating, comment })
    return response.data
  },

  remove: async (ratingId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/api/ratings/${ratingId}`)
    return response.data
  },
}

export default api
