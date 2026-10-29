'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { assistantAPI, AssistantMessage, AssistantSchool } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserLocation, UserLocation } from '@/lib/geo'
import { MessageCircle, X, Send, Bot, Lock, ExternalLink, MapPin } from 'lucide-react'

const NEAR_KEYWORDS = /\b(near|nearest|closest|nearby|close to)\b|قريب|أقرب|بالقرب/i

const SUGGESTIONS = [
  'Which schools are nearest to me?',
  'Which British schools are in Salwa?',
  'Best schools for KG in Hawally?',
]

// Clickable, DB-accurate table for schools mentioned in an assistant reply
function SchoolsTable({ schools, grade }: { schools: AssistantSchool[]; grade?: string | null }) {
  const { isAuthenticated } = useAuth()

  const hasDistance = schools.some((s) => s.distanceKm !== null && s.distanceKm !== undefined)

  const feeCell = (s: AssistantSchool) => {
    if (!isAuthenticated) {
      return (
        <Link href="/login" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
          <Lock className="h-3 w-3" /> Account
        </Link>
      )
    }
    if (grade && s.fees !== null) return `${s.fees.toLocaleString()} KD`
    if (s.feeRange) return `${s.feeRange.min.toLocaleString()}–${s.feeRange.max.toLocaleString()} KD`
    return '—'
  }

  const seatCell = (s: AssistantSchool) => {
    if (!isAuthenticated) {
      return (
        <Link href="/login" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
          <Lock className="h-3 w-3" /> Account
        </Link>
      )
    }
    const value = grade ? s.seats : s.totalSeats
    if (value === null || value === undefined) return '—'
    if (value === 0) return <span className="text-red-600 font-semibold">Full</span>
    return <span className="text-green-700 font-semibold">{value}</span>
  }

  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-secondary-500">
            <th className="text-left font-semibold px-2.5 py-1.5">School</th>
            {hasDistance && <th className="text-left font-semibold px-2.5 py-1.5">Distance</th>}
            <th className="text-left font-semibold px-2.5 py-1.5">Fees{grade ? ` (${grade})` : ''}</th>
            <th className="text-left font-semibold px-2.5 py-1.5">{grade ? `Seats (${grade})` : 'Open seats'}</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.schoolID} className="border-t border-gray-100">
              <td className="px-2.5 py-1.5">
                <Link
                  href={`/schools/${s.schoolID}`}
                  className="inline-flex items-center gap-1 font-medium text-primary-600 hover:underline"
                >
                  {s.schoolName}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
                <span className="block text-[10px] text-secondary-400">{s.area} · {s.system}</span>
              </td>
              {hasDistance && (
                <td className="px-2.5 py-1.5 whitespace-nowrap text-secondary-700">
                  {s.distanceKm !== null && s.distanceKm !== undefined ? `${s.distanceKm} km` : '—'}
                </td>
              )}
              <td className="px-2.5 py-1.5 whitespace-nowrap">{feeCell(s)}</td>
              <td className="px-2.5 py-1.5 whitespace-nowrap">{seatCell(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [userLoc, setUserLoc] = useState<UserLocation | null>(null)
  const [locating, setLocating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const requestLocation = async (): Promise<UserLocation | null> => {
    setLocating(true)
    try {
      const loc = await getBrowserLocation()
      setUserLoc(loc)
      setError('')
      return loc
    } catch {
      setError('Could not get your location — check the browser permission and try again.')
      return null
    } finally {
      setLocating(false)
    }
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || thinking) return
    setError('')
    setInput('')

    // "Nearest school?" without a shared location → ask the browser first,
    // so the answer can include real distances right away
    let loc = userLoc
    if (!loc && NEAR_KEYWORDS.test(message)) {
      loc = await requestLocation()
    }

    const newMessages: AssistantMessage[] = [...messages, { role: 'user', content: message }]
    setMessages(newMessages)
    setThinking(true)
    try {
      const res = await assistantAPI.chat(message, messages.slice(-8), loc)
      if (res.success && res.data?.reply) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: res.data.reply,
            schools: res.data.schools || [],
            grade: res.data.grade,
          },
        ])
      } else {
        setError(res.message || 'The assistant could not answer.')
      }
    } catch (err: any) {
      setError(
        err.response?.status === 503
          ? 'The assistant is offline right now. Please try again later.'
          : 'The assistant could not answer. Please try again.'
      )
    } finally {
      setThinking(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label="Ask the school assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[30rem] card flex flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-primary-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">School assistant</p>
                <p className="text-[11px] text-white/80">Helps you choose a school in Kuwait</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => (userLoc ? setUserLoc(null) : requestLocation())}
                className={`p-1.5 rounded transition-colors ${
                  userLoc ? 'bg-white/25' : 'hover:bg-white/10'
                } ${locating ? 'animate-pulse' : ''}`}
                title={userLoc ? 'Location shared — click to stop sharing' : 'Share my location for "nearest school" answers'}
                aria-label="Share location"
              >
                <MapPin className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div>
                <p className="text-sm text-secondary-500 mb-3">
                  Hi! Ask me anything about schools in Kuwait — areas, curricula, languages and more.
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-white border border-gray-200 text-secondary-700 hover:border-primary-400 hover:text-primary-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`${m.role === 'user' ? 'max-w-[85%]' : 'max-w-full w-fit'} px-3 py-2 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-secondary-800 rounded-bl-sm'
                  }`}
                >
                  <span className="whitespace-pre-wrap">{m.content}</span>
                  {m.role === 'assistant' && m.schools && m.schools.length > 0 && (
                    <SchoolsTable schools={m.schools} grade={m.grade} />
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-secondary-300 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-secondary-300 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-secondary-300 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-accent-600 text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="border-t border-gray-200 bg-white p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about schools…"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              className="btn-primary px-3"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
