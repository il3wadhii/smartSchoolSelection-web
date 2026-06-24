'use client'

import { GraduationCap, School, ShieldCheck } from 'lucide-react'

// Slim portal switcher that sits above the parent-site header. Parents is the
// current site; Schools / Admin open the other two portals. In production these
// become subdomains of smartschoolselection.cloud; in dev they're the local ports.
const SCHOOLS_URL = 'http://localhost:3002'
const ADMIN_URL = 'http://localhost:3000'

export default function PrevPortalBar() {
  return (
    <div className="prev-portalbar">
      <div className="prev-c row">
        <span className="lbl">smartschoolselection.cloud</span>
        <nav className="tabs" aria-label="Portals">
          <span className="ptab on"><GraduationCap size={14} /> Parents</span>
          <a className="ptab" href={SCHOOLS_URL}><School size={14} /> Schools</a>
          <a className="ptab" href={ADMIN_URL}><ShieldCheck size={14} /> Admin</a>
        </nav>
      </div>
    </div>
  )
}
