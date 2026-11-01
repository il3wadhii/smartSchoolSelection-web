'use client'

import { useEffect, useRef, useState } from 'react'
import { Look, readLook, onLook } from '../lib/look'

// Illustrated Kuwait skyline drawn on a canvas behind the home hero:
// Kuwait Towers, Liberation Tower, Al Hamra, low school buildings in front.
// Procedural (no image assets); colours follow the chosen look.

type Theme = {
  sky: string[]; far: string; mid: string; near: string; win: string; winOn: number; stars: number
  glow: string; ground: string; paper: boolean
  rim: string      // light catching the sun side of each building
  tile: string     // mosaic discs on the Kuwait Towers spheres
  stone: string    // Al Hamra's limestone cut face / Liberation's concrete ribs
  sea: string[]    // water band gradient in front of the waterfront towers
}
const THEME: Record<Exclude<Look, 'current'>, Theme> = {
  dusk:  { sky: ['#0F4F56', '#1A8A8C', '#F2B37A', '#F08A3C'], far: 'rgba(20,70,78,.28)', mid: '#1E4A52', near: '#152F36', win: '#FFD39A', winOn: .55, stars: 0, glow: 'rgba(240,138,60,.35)', ground: '#10272D', paper: false,
           rim: 'rgba(255,196,130,.42)', tile: 'rgba(140,214,220,.55)', stone: 'rgba(244,222,190,.22)', sea: ['rgba(240,170,110,.35)', 'rgba(16,39,45,.0)'] },
  night: { sky: ['#040F13', '#07252C', '#0D3D46', '#13525B'], far: 'rgba(255,255,255,.05)', mid: '#0B2A31', near: '#06181D', win: '#FFD27A', winOn: .8, stars: 90, glow: 'rgba(240,138,60,.22)', ground: '#040F13', paper: false,
           rim: 'rgba(255,220,160,.16)', tile: 'rgba(150,230,240,.75)', stone: 'rgba(255,235,200,.12)', sea: ['rgba(255,210,122,.18)', 'rgba(4,15,19,0)'] },
  paper: { sky: ['#DDEFF0', '#EAF3F0', '#F7F3E8', '#FBF8F1'], far: '#CFE3E2', mid: '#A9CFCD', near: '#7FB5B4', win: '#FFFFFF', winOn: 0, stars: 0, glow: 'rgba(240,138,60,.18)', ground: '#5F9C9B', paper: true,
           rim: 'rgba(255,255,255,.45)', tile: 'rgba(255,255,255,.55)', stone: 'rgba(255,255,255,.35)', sea: ['rgba(255,255,255,.35)', 'rgba(95,156,155,0)'] },
}

const rnd = (seed: number) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280 }
type Ctx = CanvasRenderingContext2D

/** Draw `path` (a closed shape) filled with `fill`, then a sun-side rim light inside it. */
function solid(c: Ctx, path: () => void, fill: string, t: Theme, x0: number, x1: number) {
  c.beginPath(); path(); c.closePath(); c.fillStyle = fill; c.fill()
  c.save(); c.beginPath(); path(); c.closePath(); c.clip()
  const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.72, 'rgba(0,0,0,0)'); g.addColorStop(1, t.rim)
  c.fillStyle = g; c.fillRect(x0 - 2, -9999, x1 - x0 + 4, 20000)
  c.restore()
}
function rect(c: Ctx, x: number, y: number, w: number, h: number) { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h) }

function draw(canvas: HTMLCanvasElement, t: Theme) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (!w || !h) return
  canvas.width = w * dpr; canvas.height = h * dpr
  const c = canvas.getContext('2d'); if (!c) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  // sky
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, t.sky[0]); g.addColorStop(.45, t.sky[1]); g.addColorStop(.8, t.sky[2]); g.addColorStop(1, t.sky[3])
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  if (t.stars) { const r = rnd(7); c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < t.stars; i++) { c.globalAlpha = .3 + r() * .7; c.fillRect(r() * w, r() * h * .55, r() * 1.4 + .3, r() * 1.4 + .3) } c.globalAlpha = 1 }
  // sun / city glow low on the right
  const gx = w * .78, gy = h * .82
  const rg = c.createRadialGradient(gx, gy, 10, gx, gy, Math.max(w, h) * .5); rg.addColorStop(0, t.glow); rg.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = rg; c.fillRect(0, 0, w, h)
  if (!t.paper) { // sun disc sitting on the horizon (dusk) / moon (night)
    c.beginPath(); c.arc(gx, gy, t.stars ? 14 : 34, 0, Math.PI * 2); c.fillStyle = t.stars ? 'rgba(255,244,214,.9)' : 'rgba(255,214,150,.85)'; c.fill()
  }
  const base = h, H = Math.min(h, 820)
  // far haze: low city
  { const r = rnd(3); c.fillStyle = t.far; let x = -20; while (x < w + 20) { const bw = 30 + r() * 70, bh = (.10 + r() * .36) * H * .75; c.fillRect(x, base - bh, bw, bh); x += bw + 4 + r() * 14 } }
  // mid layer: generic towers + mosque, spaced to leave the centre (Orbit) calmer
  { const r = rnd(17); let x = -10; while (x < w + 10) { const bw = 34 + r() * 56, bh = (.22 + r() * .26) * H * .75; const inCentre = x + bw > w * .36 && x < w * .64; const hh = inCentre ? bh * .55 : bh; solid(c, () => rect(c, x, base - hh, bw, hh), t.mid, t, x, x + bw); if (t.winOn) windows(c, x, base - hh, bw, hh, t, r, .45); x += bw + 8 + r() * 22 } }
  grandMosque(c, w * .16, base, H * .36, t)
  seifClock(c, w * .30, base, H * .30, t)
  // the three landmarks on the waterfront, right of centre
  liberation(c, w * .60, base, H * .88, t)
  alHamra(c, w * .70, base, H * .80, t)
  kuwaitTowers(c, w * .82, base, H * .70, t)
  // water band the towers stand beside
  { const sg = c.createLinearGradient(0, base - 42, 0, base - 6); sg.addColorStop(0, t.sea[0]); sg.addColorStop(1, t.sea[1]); c.fillStyle = sg; c.fillRect(w * .5, base - 42, w * .5, 36) }
  schools(c, w, base, t)
  c.fillStyle = t.ground; c.fillRect(0, base - 6, w, 6)
}
function windows(c: Ctx, x: number, y: number, bw: number, bh: number, t: Theme, r: () => number, density: number) {
  c.fillStyle = t.win
  for (let yy = y + 10; yy < y + bh - 8; yy += 12) for (let xx = x + 6; xx < x + bw - 6; xx += 10) if (r() < t.winOn * density) { c.globalAlpha = .5 + r() * .5; c.fillRect(xx, yy, 4, 6) }
  c.globalAlpha = 1
}

/* Kuwait Towers (1979): three concrete needles on one podium. The main tower
   carries two spheres (a big water tank + restaurant, a small viewing sphere),
   the second one sphere, the third is a bare needle. The spheres are covered
   in thousands of enamelled steel discs, blue-green, in horizontal rows. */
function kuwaitTowers(c: Ctx, x: number, base: number, H: number, t: Theme) {
  // podium
  solid(c, () => { c.moveTo(x - H * .16, base); c.lineTo(x + H * .66, base); c.lineTo(x + H * .62, base - 10); c.lineTo(x - H * .12, base - 10) }, t.near, t, x - H * .16, x + H * .66)
  const needle = (nx: number, nh: number, wBase: number) => solid(c, () => { c.moveTo(nx - wBase / 2, base - 10); c.lineTo(nx + wBase / 2, base - 10); c.lineTo(nx + 1.2, base - nh); c.lineTo(nx - 1.2, base - nh) }, t.near, t, nx - wBase / 2, nx + wBase / 2)
  // main tower: 187 m — big sphere at ~44 %, small sphere at ~66 %
  needle(x, H, H * .075)
  sphere(c, x, base - H * .44, H * .105, t, true)
  sphere(c, x, base - H * .67, H * .058, t, false)
  // second tower: 147 m with one sphere
  const x2 = x + H * .30; needle(x2, H * .78, H * .062); sphere(c, x2, base - H * .50, H * .082, t, false)
  // third tower: a 113 m needle with the lighting bulb near the top
  const x3 = x + H * .52; needle(x3, H * .60, H * .05)
  solid(c, () => { c.moveTo(x3 - H * .014, base - H * .42); c.lineTo(x3 + H * .014, base - H * .42); c.lineTo(x3 + H * .006, base - H * .58); c.lineTo(x3 - H * .006, base - H * .58) }, t.near, t, x3 - 6, x3 + 6)
}
function sphere(c: Ctx, x: number, y: number, r: number, t: Theme, big: boolean) {
  // body with a soft light from the upper left
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r)
  g.addColorStop(0, t.paper ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = t.near; c.fill(); c.fillStyle = g; c.fill()
  // the disc mosaic: rows of small dots, denser towards the equator; the big sphere's upper third is the plain viewing band
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip()
  c.fillStyle = t.tile
  const step = Math.max(3, r / 7)
  for (let yy = y - r; yy <= y + r; yy += step) {
    if (big && yy < y - r * .35) continue
    const half = Math.sqrt(Math.max(0, r * r - (yy - y) * (yy - y)))
    for (let xx = x - half; xx <= x + half; xx += step) { c.globalAlpha = .35 + .65 * (1 - Math.abs(yy - y) / r); c.beginPath(); c.arc(xx, yy, step * .28, 0, Math.PI * 2); c.fill() }
  }
  c.globalAlpha = 1
  if (big) { // seam ring between the viewing band and the tank
    c.fillStyle = t.paper ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)'; c.fillRect(x - r, y - r * .35, r * 2, 1.5)
    if (t.winOn) { c.fillStyle = t.win; c.globalAlpha = .9; for (let xx = x - r * .9; xx < x + r * .9; xx += 6) c.fillRect(xx, y - r * .55, 3, 4); c.globalAlpha = 1 }
  }
  c.restore()
}

/* Liberation Tower (1996, 372 m). Read from the real profile: a big stepped
   base building, a slim concrete spike that tapers with a slight inward curve,
   the observation complex at ~40 % that flares out from the shaft like an
   inverted cone into a wide two-storey deck, a stack of narrowing tiled rings
   above it, a few thin antenna platforms further up, and a long mast. */
function liberation(c: Ctx, x: number, base: number, H: number, t: Theme) {
  // stepped base building
  solid(c, () => { c.moveTo(x - H * .13, base); c.lineTo(x + H * .13, base); c.lineTo(x + H * .10, base - H * .05); c.lineTo(x - H * .10, base - H * .05) }, t.near, t, x - H * .13, x + H * .13)
  solid(c, () => { c.moveTo(x - H * .085, base - H * .05); c.lineTo(x + H * .085, base - H * .05); c.lineTo(x + H * .06, base - H * .095); c.lineTo(x - H * .06, base - H * .095) }, t.near, t, x - H * .085, x + H * .085)
  if (t.winOn) { c.fillStyle = t.win; c.globalAlpha = .7; for (let xx = x - H * .09; xx < x + H * .09; xx += 9) { c.fillRect(xx, base - H * .035, 4, 5); c.fillRect(xx, base - H * .08, 4, 5) } c.globalAlpha = 1 }
  // shaft: tapers from the base to the mast with a gentle concave profile
  const shaft = () => {
    c.moveTo(x - H * .036, base - H * .095); c.lineTo(x + H * .036, base - H * .095)
    c.quadraticCurveTo(x + H * .016, base - H * .45, x + H * .012, base - H * .74)
    c.lineTo(x - H * .012, base - H * .74)
    c.quadraticCurveTo(x - H * .016, base - H * .45, x - H * .036, base - H * .095)
  }
  solid(c, shaft, t.near, t, x - H * .036, x + H * .036)
  c.fillStyle = t.stone; for (let i = -1; i <= 1; i++) c.fillRect(x + i * H * .012 - .5, base - H * .72, 1, H * .6)
  // observation complex: inverted cone flaring from the shaft into the wide deck
  const deckY = base - H * .415, deckW = H * .085, deckH = H * .045
  solid(c, () => { c.moveTo(x - H * .02, base - H * .355); c.lineTo(x + H * .02, base - H * .355); c.lineTo(x + deckW, deckY + deckH); c.lineTo(x - deckW, deckY + deckH) }, t.near, t, x - deckW, x + deckW)
  solid(c, () => rect(c, x - deckW, deckY, deckW * 2, deckH), t.near, t, x - deckW, x + deckW)
  // the deck's two storeys: a lit window band and the revolving restaurant band
  if (t.winOn) { c.fillStyle = t.win; c.globalAlpha = .9; for (let xx = x - deckW + 3; xx < x + deckW - 3; xx += 5) { c.fillRect(xx, deckY + deckH * .18, 3, deckH * .22); c.fillRect(xx, deckY + deckH * .58, 3, deckH * .22) } c.globalAlpha = 1 }
  else { c.fillStyle = t.stone; c.fillRect(x - deckW + 2, deckY + deckH * .3, deckW * 2 - 4, 1.5); c.fillRect(x - deckW + 2, deckY + deckH * .68, deckW * 2 - 4, 1.5) }
  // stack of narrowing tiled rings above the deck
  const tiers: [number, number][] = [[.066, .022], [.052, .02], [.04, .018], [.03, .016]]
  let ty = deckY
  for (const [tw, th] of tiers) {
    const rw = H * tw, rh = H * th; ty -= rh
    solid(c, () => rect(c, x - rw, ty, rw * 2, rh), t.near, t, x - rw, x + rw)
    c.fillStyle = t.tile; c.globalAlpha = .9; c.fillRect(x - rw + 1, ty + rh * .35, rw * 2 - 2, 1.5); c.globalAlpha = 1
  }
  // antenna platforms up the spike
  for (const [py, pw] of [[.60, .028], [.655, .024], [.71, .02]] as [number, number][]) {
    solid(c, () => rect(c, x - H * pw, base - H * py, H * pw * 2, 3), t.near, t, x - H * pw, x + H * pw)
  }
  // mast: a thicker antenna cylinder, then the thin tip with the aviation light
  solid(c, () => rect(c, x - H * .008, base - H * .86, H * .016, H * .12), t.near, t, x - H * .008, x + H * .008)
  c.fillStyle = t.near; c.fillRect(x - 1.2, base - H, 2.4, H * .15)
  c.beginPath(); c.arc(x, base - H * .985, 2.4, 0, Math.PI * 2); c.fillStyle = t.winOn ? '#FF6B6B' : t.near; c.fill()
}

/* Al Hamra Tower (2011, 412 m): a tall limestone-and-glass slab whose south
   face is carved away in a quarter turn, so the silhouette is a straight edge
   on one side and a long concave sweep up to a narrow, slanted top. */
function alHamra(c: Ctx, x: number, base: number, H: number, t: Theme) {
  const W = H * .085
  const body = () => { c.moveTo(x - W, base); c.lineTo(x + W, base); c.lineTo(x + W, base - H * .30); c.quadraticCurveTo(x + W * 1.15, base - H * .92, x - W * .15, base - H); c.lineTo(x - W, base - H * .985) }
  solid(c, body, t.mid, t, x - W, x + W)
  // the carved stone face: a lighter sliver along the sweep
  c.save(); c.beginPath(); body(); c.closePath(); c.clip()
  c.beginPath(); c.moveTo(x + W, base - H * .30); c.quadraticCurveTo(x + W * 1.15, base - H * .92, x - W * .15, base - H); c.lineTo(x - W * .15 - W * .45, base - H); c.quadraticCurveTo(x + W * .55, base - H * .9, x + W * .45, base - H * .3); c.closePath()
  c.fillStyle = t.stone; c.fill()
  // floor lines on the glass face
  c.fillStyle = t.paper ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.07)'; for (let yy = base - 14; yy > base - H; yy -= 11) c.fillRect(x - W, yy, W * 2, 1)
  if (t.winOn) { const r = rnd(5); windows(c, x - W + 2, base - H, W * 2 - 4, H, t, r, .3) }
  c.restore()
}

/* Grand Mosque: a wide prayer hall, the big central dome on a drum, and the
   tall slender minaret with its balcony. */
function grandMosque(c: Ctx, x: number, base: number, H: number, t: Theme) {
  const W = H * .9
  solid(c, () => rect(c, x - W / 2, base - H * .34, W, H * .34), t.mid, t, x - W / 2, x + W / 2)
  solid(c, () => rect(c, x - W * .22, base - H * .46, W * .44, H * .14), t.mid, t, x - W * .22, x + W * .22)
  solid(c, () => { c.arc(x, base - H * .46, W * .22, Math.PI, 0) ; c.lineTo(x + W * .22, base - H * .46) }, t.mid, t, x - W * .22, x + W * .22)
  c.fillStyle = t.mid; c.fillRect(x - 1, base - H * .46 - W * .22 - 12, 2, 12)
  // small corner domes
  for (const dx of [-W * .42, W * .42]) { c.beginPath(); c.arc(x + dx, base - H * .34, W * .07, Math.PI, 0); c.fillStyle = t.mid; c.fill() }
  // minaret
  const mx = x + W * .62
  solid(c, () => { c.moveTo(mx - H * .035, base); c.lineTo(mx + H * .035, base); c.lineTo(mx + H * .02, base - H * .92); c.lineTo(mx - H * .02, base - H * .92) }, t.mid, t, mx - H * .035, mx + H * .035)
  c.fillStyle = t.mid; c.fillRect(mx - H * .04, base - H * .66, H * .08, 5); c.fillRect(mx - H * .03, base - H * .82, H * .06, 4)
  c.beginPath(); c.arc(mx, base - H * .95, H * .03, 0, Math.PI * 2); c.fill(); c.fillRect(mx - .8, base - H, 1.6, H * .05)
  if (t.winOn) { c.fillStyle = t.win; c.globalAlpha = .8; for (let xx = x - W / 2 + 8; xx < x + W / 2 - 8; xx += 14) c.fillRect(xx, base - H * .24, 4, 9); c.globalAlpha = 1 }
}

/* Seif Palace clock tower: square shaft, the blue-tiled top, four clock faces. */
function seifClock(c: Ctx, x: number, base: number, H: number, t: Theme) {
  const W = H * .14
  solid(c, () => rect(c, x - W, base - H * .8, W * 2, H * .8), t.mid, t, x - W, x + W)
  solid(c, () => { c.moveTo(x - W * 1.25, base - H * .8); c.lineTo(x + W * 1.25, base - H * .8); c.lineTo(x, base - H) }, t.mid, t, x - W * 1.25, x + W * 1.25)
  c.beginPath(); c.arc(x, base - H * .68, W * .55, 0, Math.PI * 2); c.fillStyle = t.winOn ? t.win : 'rgba(255,255,255,.5)'; c.fill()
  c.strokeStyle = t.mid; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, base - H * .68); c.lineTo(x, base - H * .68 - W * .4); c.moveTo(x, base - H * .68); c.lineTo(x + W * .3, base - H * .68); c.stroke()
}

function schools(c: Ctx, w: number, base: number, t: Theme) {
  const r = rnd(21); let x = -30
  while (x < w + 40) {
    const bw = 90 + r() * 80, floors = 2 + Math.floor(r() * 2), fh = 22, bh = floors * fh + 10
    solid(c, () => rect(c, x, base - bh, bw, bh), t.near, t, x, x + bw)
    if (r() < .5) { c.beginPath(); c.moveTo(x - 6, base - bh); c.lineTo(x + bw / 2, base - bh - 26); c.lineTo(x + bw + 6, base - bh); c.closePath(); c.fillStyle = t.near; c.fill() }
    else { c.fillStyle = t.near; c.fillRect(x + bw * .5 - 1, base - bh - 22, 2, 22); c.fillStyle = t.paper ? '#F08A3C' : 'rgba(240,138,60,.9)'; c.fillRect(x + bw * .5 + 1, base - bh - 22, 12, 8) }
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
