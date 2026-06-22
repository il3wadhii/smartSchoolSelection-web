'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userAPI } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { UserCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser, isLoading: authLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [form, setForm] = useState({ name: '', lastName: '', phone: '', gender: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    const load = async () => {
      try {
        const res = await userAPI.profile()
        if (res.success && res.data) {
          const u = res.data.user || res.data
          setForm({
            name: u.name || '',
            lastName: u.lastName || '',
            phone: u.phone || '',
            gender: u.gender || '',
          })
        }
      } catch {
        addToast({ type: 'error', title: 'Failed to load profile' })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: form.name,
        lastName: form.lastName,
        phone: form.phone,
        // API expects capitalized gender on this endpoint
        gender: form.gender ? form.gender[0].toUpperCase() + form.gender.slice(1).toLowerCase() : '',
      }
      if (passwords.newPassword) {
        payload.currentPassword = passwords.currentPassword
        payload.newPassword = passwords.newPassword
      }
      const res = await userAPI.updateProfile(payload)
      if (res.success) {
        addToast({ type: 'success', title: 'Profile updated' })
        setPasswords({ currentPassword: '', newPassword: '' })
        if (user) {
          updateUser({ ...user, name: form.name, lastName: form.lastName, phone: form.phone, gender: form.gender })
        }
      } else {
        addToast({ type: 'error', title: 'Update failed', message: res.message })
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update failed', message: err.response?.data?.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center gap-3 mb-6">
        <UserCircle className="h-10 w-10 text-primary-600" />
        <div>
          <h1 className="text-xl font-bold text-secondary-900">My profile</h1>
          <p className="text-sm text-secondary-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">First name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Last name</label>
            <input
              className="input-field"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Phone</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Gender</label>
            <select
              className="input-field"
              value={form.gender.toLowerCase()}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />

        <p className="text-sm font-semibold text-secondary-700">Change password (optional)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input-field"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="input-field"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
