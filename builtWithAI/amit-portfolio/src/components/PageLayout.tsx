import type { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

function PageLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell relative min-h-screen overflow-x-clip bg-ink text-white"><div aria-hidden="true" className="ambient ambient--violet pointer-events-none absolute inset-x-0 top-0 h-[680px]" /><SiteHeader />{children}<SiteFooter /></div>
}
export default PageLayout