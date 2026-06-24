import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './preview.css'
import PrevPortalBar from './components/PrevPortalBar'
import PrevHeader from './components/PrevHeader'
import PrevFooter from './components/PrevFooter'
import PrevTabBar from './components/PrevTabBar'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Smart School Selection — find the best school in Kuwait',
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`prev ${poppins.variable}`}>
      <PrevPortalBar />
      <PrevHeader />
      <main>{children}</main>
      <PrevFooter />
      <PrevTabBar />
    </div>
  )
}
