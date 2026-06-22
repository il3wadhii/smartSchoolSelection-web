import Link from 'next/link'
import { Instagram, Facebook, Twitter } from 'lucide-react'

export default function PrevFooter() {
  return (
    <footer className="prev-footer">
      <div className="prev-c frow">
        <Link href="/preview" className="prev-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Smart School Selection logo" style={{ height: 34, width: 34 }} />
          <span className="wm" style={{ fontSize: 15 }}>Smart School Selection</span>
        </Link>
        <span className="muted">© 2026 Smart School Selection · Kuwait</span>
        <div className="prev-soc">
          <a href="#" aria-label="Instagram"><Instagram size={17} /></a>
          <a href="#" aria-label="Facebook"><Facebook size={17} /></a>
          <a href="#" aria-label="Twitter"><Twitter size={17} /></a>
        </div>
      </div>
    </footer>
  )
}
