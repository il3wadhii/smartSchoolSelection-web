import { getImageUrl } from '@/lib/api'
import { School } from '@/types'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Tile({ s }: { s: School }) {
  const src = getImageUrl(s.schoolImgURL)
  return (
    <span className="prev-plogo" title={s.schoolName}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={s.schoolName} loading="lazy" />
      ) : (
        <span className="pmono">{initials(s.schoolName)}</span>
      )}
    </span>
  )
}

// Two rows of real school logos drifting in opposite directions. Each row is
// rendered twice so the CSS -50% translate loops seamlessly.
export default function PartnerMarquee({ schools }: { schools: School[] }) {
  if (!schools.length) return null
  const withLogos = schools.filter((s) => s.schoolImgURL)
  const pool = withLogos.length >= 6 ? withLogos : schools
  const half = Math.max(1, Math.ceil(pool.length / 2))
  const rowA = pool.slice(0, half)
  const rowB = pool.slice(half).length ? pool.slice(half) : pool.slice(0, half)

  return (
    <>
      <div className="prev-marq">
        <div className="prev-track l">
          {[...rowA, ...rowA].map((s, i) => <Tile key={`a${i}`} s={s} />)}
        </div>
      </div>
      <div className="prev-marq">
        <div className="prev-track r">
          {[...rowB, ...rowB].map((s, i) => <Tile key={`b${i}`} s={s} />)}
        </div>
      </div>
    </>
  )
}
