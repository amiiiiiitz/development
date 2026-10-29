import type { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

function PageLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell relative min-h-screen overflow-x-clip bg-ink text-white"><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_70%_at_50%_0%,rgba(217,181,76,0.08),transparent_70%)]" /><SiteHeader />{children}<SiteFooter /></div>
}
export default PageLayout