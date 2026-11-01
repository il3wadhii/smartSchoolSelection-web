'use client'

import { useEffect, useRef, useState } from 'react'
import { Look, readLook, onLook } from '../lib/look'

// Illustrated Kuwait skyline drawn on a canvas behind the home hero:
// Kuwait Towers, Liberation Tower, Al Hamra, low school buildings in front.
// Procedural (no image assets); colours follow the chosen look.

type Theme = { sky: string[]; far: string; mid: string; near: string; win: string; winOn: number; stars: number; glow: string; ground: string; paper: boolean }
const THEME: Record<Exclude<Look, 'current'>, Theme> = {
  dusk:  { sky: ['#0F4F56', '#1A8A8C', '#F2B37A', '#F08A3C'], far: 'rgba(20,70,78,.28)', mid: '#1E4A52', near: '#152F36', win: '#FFD39A', winOn: .55, stars: 0, glow: 'rgba(240,138,60,.35)', ground: '#10272D', paper: false },
  night: { sky: ['#040F13', '#07252C', '#0D3D46', '#13525B'], far: 'rgba(255,255,255,.05)', mid: '#0B2A31', near: '#06181D', win: '#FFD27A', winOn: .8, stars: 90, glow: 'rgba(240,138,60,.22)', ground: '#040F13', paper: false },
  paper: { sky: ['#DDEFF0', '#EAF3F0', '#F7F3E8', '#FBF8F1'], far: '#CFE3E2', mid: '#A9CFCD', near: '#7FB5B4', win: '#FFFFFF', winOn: 0, stars: 0, glow: 'rgba(240,138,60,.18)', ground: '#5F9C9B', paper: true },
}

const rnd = (seed: number) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280 }

function draw(canvas: HTMLCanvasElement, t: Theme) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (!w || !h) return
  canvas.width = w * dpr; canvas.height = h * dpr
  const c = canvas.getContext('2d'); if (!c) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, t.sky[0]); g.addColorStop(.45, t.sky[1]); g.addColorStop(.8, t.sky[2]); g.addColorStop(1, t.sky[3])
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  if (t.stars) { const r = rnd(7); c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < t.stars; i++) { c.globalAlpha = .3 + r() * .7; c.fillRect(r() * w, r() * h * .55, r() * 1.4 + .3, r() * 1.4 + .3) } c.globalAlpha = 1 }
  const gx = w * .72, gy = h * .8
  const rg = c.createRadialGradient(gx, gy, 10, gx, gy, Math.max(w, h) * .45); rg.addColorStop(0, t.glow); rg.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = rg; c.fillRect(0, 0, w, h)
  const base = h, H = Math.min(h, 760)
  // far blocks
  { const r = rnd(3); c.fillStyle = t.far; let x = -20; while (x < w + 20) { const bw = 30 + r() * 70, bh = (.12 + r() * .42) * H * .75; c.fillRect(x, base - bh, bw, bh); x += bw + 4 + r() * 14 } }
  // mid blocks
  { const r = rnd(17); let x = -10; while (x < w + 10) { const bw = 34 + r() * 60, bh = (.3 + r() * .25) * H * .75; c.fillStyle = t.mid; c.fillRect(x, base - bh, bw, bh); if (t.winOn) windows(c, x, base - bh, bw, bh, t, r, .5); x += bw + 6 + r() * 18 } }
  kuwaitTowers(c, w * .80, base, H * .72, t)
  liberation(c, w * .56, base, H * .8, t)
  alHamra(c, w * .66, base, H * .64, t)
  schools(c, w, base, t)
  c.fillStyle = t.ground; c.fillRect(0, base - 6, w, 6)
}
function windows(c: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, t: Theme, r: () => number, density: number) {
  c.fillStyle = t.win
  for (let yy = y + 10; yy < y + bh - 8; yy += 12) for (let xx = x + 6; xx < x + bw - 6; xx += 10) if (r() < t.winOn * density) { c.globalAlpha = .5 + r() * .5; c.fillRect(xx, yy, 4, 6) }
  c.globalAlpha = 1
}
function sphere(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: Theme) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = t.near; c.fill()
  if (!t.paper) { c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip(); c.fillStyle = t.win; c.globalAlpha = t.winOn ? .55 : .3; for (let i = -r; i < r; i += 5) c.fillRect(x - r, y + i, r * 2, 1.5); c.restore(); c.globalAlpha = 1 }
  else { c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .55, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill() }
}
function kuwaitTowers(c: CanvasRenderingContext2D, x: number, base: number, height: number, t: Theme) {
  c.fillStyle = t.near
  c.fillRect(x - 4, base - height, 8, height)
  sphere(c, x, base - height * .56, height * .11, t); sphere(c, x, base - height * .86, height * .065, t)
  const x2 = x + height * .22; c.fillStyle = t.near; c.fillRect(x2 - 3, base - height * .72, 6, height * .72); sphere(c, x2, base - height * .6, height * .085, t)
  const x3 = x + height * .36; c.fillStyle = t.near; c.fillRect(x3 - 2, base - height * .62, 4, height * .62)
}
function liberation(c: CanvasRenderingContext2D, x: number, base: number, height: number, t: Theme) {
  c.fillStyle = t.near
  c.beginPath(); c.moveTo(x - 14, base); c.lineTo(x + 14, base); c.lineTo(x + 7, base - height * .72); c.lineTo(x - 7, base - height * .72); c.closePath(); c.fill()
  c.beginPath(); c.ellipse(x, base - height * .72, 26, 9, 0, 0, Math.PI * 2); c.fill()
  c.fillRect(x - 9, base - height * .72, 18, -height * .06)
  c.beginPath(); c.ellipse(x, base - height * .78, 14, 5, 0, 0, Math.PI * 2); c.fill()
  c.fillRect(x - 1.5, base - height, 3, height * .22)
  if (t.winOn) { c.fillStyle = t.win; c.globalAlpha = .9; c.fillRect(x - 24, base - height * .72 - 2, 48, 1.5); c.globalAlpha = 1 }
}
function alHamra(c: CanvasRenderingContext2D, x: number, base: number, height: number, t: Theme) {
  c.fillStyle = t.mid
  c.beginPath(); c.moveTo(x - 26, base); c.lineTo(x + 26, base); c.lineTo(x + 26, base - height); c.lineTo(x - 2, base - height)
  c.quadraticCurveTo(x - 30, base - height * .55, x - 26, base - height * .2); c.closePath(); c.fill()
  if (t.winOn) windows(c, x - 24, base - height, 50, height, t, rnd(5), .35)
}
function schools(c: CanvasRenderingContext2D, w: number, base: number, t: Theme) {
  const r = rnd(21); let x = -30
  while (x < w + 40) {
    const bw = 90 + r() * 80, floors = 2 + Math.floor(r() * 2), fh = 22, bh = floors * fh + 10
    c.fillStyle = t.near; c.fillRect(x, base - bh, bw, bh)
    if (r() < .5) { c.beginPath(); c.moveTo(x - 6, base - bh); c.lineTo(x + bw / 2, base - bh - 26); c.lineTo(x + bw + 6, base - bh); c.closePath(); c.fill() }
    else { c.fillRect(x + bw * .5 - 1, base - bh - 22, 2, 22); c.fillStyle = t.paper ? '#F08A3C' : 'rgba(240,138,60,.9)'; c.fillRect(x + bw * .5 + 1, base - bh - 22, 12, 8) }
    c.fillStyle = t.paper ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'; c.fillRect(x + bw / 2 - 7, base - 20, 14, 20)
    if (!t.paper) { c.fillStyle = t.win; for (let f = 0; f < floors; f++) for (let wx = x + 10; wx < x + bw - 12; wx += 16) if (r() < (t.winOn ? .75 : .45)) { c.globalAlpha = t.winOn ? .75 + r() * .25 : .5; c.fillRect(wx, base - bh + 10 + f * fh, 8, 10) } c.globalAlpha = 1 }
    else { c.fillStyle = 'rgba(255,255,255,.55)'; for (let f = 0; f < floors; f++) for (let wx = x + 10; wx < x + bw - 12; wx += 16) c.fillRect(wx, base - bh + 10 + f * fh, 8, 10) }
    x += bw + 30 + r() * 60
  }
}

export default function Skyline() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [look, setLook] = useState<Look>('current')
  useEffect(() => { setLook(readLook()); return onLook(setLook) }, [])
  useEffect(() => {
    if (look === 'current' || !ref.current) return
    const el = ref.current
    const paint = () => draw(el, THEME[look])
    paint()
    const ro = new ResizeObserver(paint); ro.observe(el)
    return () => ro.disconnect()
  }, [look])
  if (look === 'current') return null
  return <canvas ref={ref} className="prev-skyline" aria-hidden="true" />
}
