// Day / Night theme of the parents' site (the Kuwait-skyline glass design).
//   day   — daylight paper-cut skyline, ink text, paper-white sheets
//   night — sunset-to-night sky, white headline, frosted sheets
// Both use the brand palette only (teal, orange, navy, cream).
// Default follows the visitor's clock (06:00–18:00 = day); a choice made with
// the header toggle is remembered in this browser and wins.
export type Look = 'day' | 'night'
export const LOOKS: Look[] = ['day', 'night']
const KEY = 'ssc-theme'
const EVT = 'ssc-theme-change'

export function readLook(): Look {
  if (typeof window === 'undefined') return 'day'
  try {
    const q = new URLSearchParams(window.location.search).get('theme') as Look | null
    if (q && LOOKS.includes(q)) { localStorage.setItem(KEY, q); return q }
    const s = localStorage.getItem(KEY) as Look | null
    if (s && LOOKS.includes(s)) return s
  } catch {}
  const h = new Date().getHours()
  return h >= 6 && h < 18 ? 'day' : 'night'
}

export function applyLook(look: Look) {
  const root = document.querySelector<HTMLElement>('.prev')
  if (root) root.setAttribute('data-look', look)
  try { localStorage.setItem(KEY, look) } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: look }))
}

export function onLook(fn: (l: Look) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<Look>).detail)
  window.addEventListener(EVT, h)
  return () => window.removeEventListener(EVT, h)
}

/** Inline, runs before paint: picks the theme the same way readLook() does. */
export const THEME_BOOT_SCRIPT = `(function(){try{var r=document.currentScript.parentElement;var q=new URLSearchParams(location.search).get('theme');var s=null;try{s=localStorage.getItem('${KEY}')}catch(e){}var v=(q==='day'||q==='night')?q:(s==='day'||s==='night')?s:((new Date().getHours()>=6&&new Date().getHours()<18)?'day':'night');r.setAttribute('data-look',v)}catch(e){}})()`
