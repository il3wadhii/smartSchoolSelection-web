// Visual "look" of the parents' site, for the glass + Kuwait-skyline test.
//   current — the live Orbit design (no skyline)
//   paper   — DAY: daylight paper-cut skyline, glass on the search only
//   dusk    — DUSK: sunset skyline, light glass
//   night   — NIGHT: night skyline, dark glass
// All three use the brand palette only (teal, orange, navy, cream).
// Stored per browser; also settable with ?look=paper|dusk|night|current.
export type Look = 'current' | 'paper' | 'dusk' | 'night'
export const LOOKS: Look[] = ['current', 'paper', 'dusk', 'night']
const KEY = 'ssc-look'
const EVT = 'ssc-look-change'

export function readLook(): Look {
  if (typeof window === 'undefined') return 'current'
  try {
    const q = new URLSearchParams(window.location.search).get('look') as Look | null
    if (q && LOOKS.includes(q)) { localStorage.setItem(KEY, q); return q }
    const s = localStorage.getItem(KEY) as Look | null
    if (s && LOOKS.includes(s)) return s
  } catch {}
  return 'current'
}

export function applyLook(look: Look) {
  const root = document.querySelector<HTMLElement>('.prev')
  if (!root) return
  if (look === 'current') root.removeAttribute('data-look')
  else root.setAttribute('data-look', look)
  try { localStorage.setItem(KEY, look) } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: look }))
}

export function onLook(fn: (l: Look) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<Look>).detail)
  window.addEventListener(EVT, h)
  return () => window.removeEventListener(EVT, h)
}
