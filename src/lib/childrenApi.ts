import api from './api'
import { ApiResponse } from '@/types'

// Children saved on the parent's account (nickname, birth month + year, grade).
// Bearer token is attached by the shared axios instance. Never log these values.

export interface ChildExtras {
  /** the parent's own grade choice; replaces the suggested grade */
  gradeOverride?: string
  /** optional fee lines switched on for this child, by extraFeeID or label */
  on?: Record<string, boolean>
  [key: string]: unknown
}

export interface ServerChild {
  childID: number
  nickname: string | null
  birthMonth: string | null // 'YYYY-MM'
  suggestedGrade: string | null
  grade: string | null
  targetSchoolID: number | null
  extras: ChildExtras | null
}

export interface ChildrenList {
  children: ServerChild[]
  academicYear: string // '2027/28'
  gradeRuleConfirmed: boolean
  maxChildren: number
}

export interface ChildPayload {
  nickname?: string | null
  birthMonth?: string | null
  targetSchoolID?: number | null
  extras?: ChildExtras | null
}

export interface ChildSaved {
  child: ServerChild
  gradeChanged?: boolean
  alertsDeactivated?: number | boolean
}

export interface ImportItem extends ChildPayload {
  clientKey: string
}

export interface ImportResult {
  children: ServerChild[]
  imported?: number
  skipped?: number | unknown[]
  rejected?: number | unknown[]
}

export const childrenAPI = {
  list: async (): Promise<ApiResponse<ChildrenList>> => (await api.get('/api/users/children')).data,
  create: async (p: ChildPayload): Promise<ApiResponse<{ child: ServerChild }>> => (await api.post('/api/users/children', p)).data,
  update: async (id: number, p: ChildPayload): Promise<ApiResponse<ChildSaved>> => (await api.put(`/api/users/children/${id}`, p)).data,
  remove: async (id: number): Promise<ApiResponse> => (await api.delete(`/api/users/children/${id}`)).data,
  importDevice: async (children: ImportItem[]): Promise<ApiResponse<ImportResult>> => (await api.post('/api/users/children/import', { children })).data,
}

/** Seat alert tied to a child (the API deactivates it if the child's grade changes). */
export async function addSeatAlertForChild(schoolID: number, grade: string, childID: number): Promise<ApiResponse> {
  return (await api.post('/api/users/seat-alerts', { schoolID, grade, childID })).data
}
