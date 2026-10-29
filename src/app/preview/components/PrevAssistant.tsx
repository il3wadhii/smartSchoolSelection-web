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

// Brand-styled, DB-accurate table for schools mentioned in a reply.
function SchoolsTable({ schools, grade }: { schools: AssistantSchool[]; grade?: string | null }) {
  const { isAuthenticated } = useAuth()
  const hasDistance = schools.some((s) => s.distanceKm !== null && s.distanceKm !== undefined)
  const acct = (
    <Link href="/preview/login" className="acct"><Lock size={11} /> Account</Link>
  )
  const feeCell = (s: AssistantSchool) => {
    if (!isAuthenticated) return acct
    if (grade && s.fees !== null) return `${s.fees.toLocaleString()} KD`
    if (s.feeRange) return `${s.feeRange.min.toLocaleString()}–${s.feeRange.max.toLocaleString()} KD`
    return '—'
  }
  const seatCell = (s: AssistantSchool) => {
    if (!isAuthenticated) return acct
    const value = grade ? s.seats : s.totalSeats
    if (value === null || value === undefined) return '—'
    if (value === 0) return <span style={{ color: 'var(--oranged)', fontWeight: 700 }}>Full</span>
    return <span style={{ color: 'var(--teald)', fontWeight: 700 }}>{value}</span>
  }
  return (
    <div className="prev-assist-table">
      <table>
        <thead>
          <tr>
            <th>School</th>
            {hasDistance && <th>Distance</th>}
            <th>Fees{grade ? ` (${grade})` : ''}</th>
            <th>{grade ? `Seats (${grade})` : 'Seats'}</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.schoolID}>
              <td>
                <Link href={`/preview/schools/${s.schoolID}`} className="nm">
                  {s.schoolName} <ExternalLink size={11} />
                </Link>
                <span className="sub">{s.area} · {s.system}</span>
              </td>
              {hasDistance && <td>{s.distanceKm != null ? `${s.distanceKm} km` : '—'}</td>}
              <td>{feeCell(s)}</td>
              <td>{seatCell(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrevAssistant() {
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
          { role: 'assistant', content: res.data.reply, schools: res.data.schools || [], grade: res.data.grade },
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
      {!open && (
        <button className="prev-assist-fab" onClick={() => setOpen(true)} aria-label="Ask the school assistant">
          <MessageCircle size={24} />
        </button>
      )}

      {open && (
        <div className="prev-assist-panel">
          <div className="prev-assist-head">
            <div className="who">
              <span className="ic"><Bot size={18} /></span>
              <div>
                <b>School assistant</b>
                <small>Ask anything about schools in Kuwait</small>
              </div>
            </div>
            <div className="acts">
              <button
                onClick={() => (userLoc ? setUserLoc(null) : requestLocation())}
                className={`loc${userLoc ? ' on' : ''}${locating ? ' pulse' : ''}`}
                title={userLoc ? 'Location shared — click to stop' : 'Share my location for "nearest" answers'}
                aria-label="Share location"
              >
                <MapPin size={16} />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
          </div>

          <div className="prev-assist-body">
            {messages.length === 0 && (
              <div className="prev-assist-intro">
                <p>Hi! Ask me anything about schools in Kuwait — areas, curricula, languages, fees and more.</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="sugg">{s}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`prev-assist-row ${m.role}`}>
                <div className="bubble">
                  <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                  {m.role === 'assistant' && m.schools && m.schools.length > 0 && (
                    <SchoolsTable schools={m.schools} grade={m.grade} />
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="prev-assist-row assistant">
                <div className="bubble dots"><i /><i /><i /></div>
              </div>
            )}

            {error && <p className="prev-assist-err">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <form className="prev-assist-input" onSubmit={(e) => { e.preventDefault(); send(input) }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about schools…"
              maxLength={1000}
            />
            <button type="submit" disabled={thinking || !input.trim()} aria-label="Send"><Send size={16} /></button>
          </form>
        </div>
      )}
    </>
  )
}
