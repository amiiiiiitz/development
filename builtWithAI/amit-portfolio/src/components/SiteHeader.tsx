import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'

const primaryNavigation = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Experience', to: '/experience' },
  { label: 'About', to: '/about' },
]
const secondaryNavigation = [
  { label: 'Publications', to: '/publications' },
  { label: 'Endorsements', to: '/endorsements' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'Resume', to: '/resume' },
]
const allNavigation = [...primaryNavigation, ...secondaryNavigation]

function isActiveRoute(pathname: string, to: string) {
  return pathname === to || (to === '/projects' && pathname.startsWith('/projects'))
}

function SiteHeader() {
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const [moreOpenPath, setMoreOpenPath] = useState<string | null>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const menuOpen = mobileMenuPath === pathname
  const moreOpen = moreOpenPath === pathname
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMoreOpenPath(null); setMobileMenuPath(null) }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpenPath(null)
    }
    const closeOnHistoryNavigation = () => { setMoreOpenPath(null); setMobileMenuPath(null) }
    const closeOnDesktop = () => { if (window.innerWidth >= 1280) setMobileMenuPath(null) }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('popstate', closeOnHistoryNavigation)
    window.addEventListener('resize', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('popstate', closeOnHistoryNavigation)
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [])
  const linkClass = (active: boolean) => `relative inline-flex min-h-8 items-center px-1.5 py-1 text-[11px] uppercase tracking-[0.24em] transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 ${active ? 'text-white' : 'text-white/50'}`
  const contactClass = `inline-flex min-h-9 items-center justify-center gap-1.5 border px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${pathname === '/contact' ? 'border-[var(--color-accent)]/60 text-[var(--color-accent)]' : 'border-white/15 text-white/80 hover:border-[var(--color-accent)]/70 hover:text-[var(--color-accent)]'}`
  const renderLink = (item: (typeof allNavigation)[number], mobile = false) => {
    const active = isActiveRoute(pathname, item.to)
    return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} onClick={() => { setMobileMenuPath(null); setMoreOpenPath(null) }} className={mobile ? `px-1 py-3 text-xs uppercase tracking-[0.24em] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'text-white' : 'text-white/60'}` : linkClass(active)}>
      <span className={mobile ? '' : 'relative z-10'}>{item.label}</span>
      {!mobile && <span aria-hidden="true" className={`absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-300 ${active ? 'scale-x-100' : ''}`} />}
    </Link>
  }
  const activeSecondary = secondaryNavigation.some((item) => isActiveRoute(pathname, item.to))

  return <header className="sticky top-0 z-40 mx-auto grid h-[72px] w-full max-w-[82rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-white/[0.06] bg-[#070707]/90 px-3 backdrop-blur-md sm:px-6 lg:px-8">
    <Link to="/" aria-label="Amit Hasan Simanto, aspiring AI engineer — home" className="group relative z-10 flex min-w-0 shrink-0 items-center gap-3 justify-self-start whitespace-nowrap"><span className="font-display text-xl font-semibold uppercase tracking-[0.28em] text-white">Amit<span className="text-[var(--color-accent)]">.</span></span><span className="hidden border-l border-white/15 pl-3 text-[10px] uppercase tracking-[0.32em] text-white/40 sm:inline">Aspiring AI Engineer</span></Link>

    <nav aria-label="Main navigation" className="hidden min-w-0 items-center justify-self-center gap-2.5 xl:flex">
      {primaryNavigation.map((item) => renderLink(item))}
      <div ref={moreRef} className="relative">
        <button type="button" aria-haspopup="true" aria-expanded={moreOpen} aria-controls="more-pages-navigation" onClick={() => setMoreOpenPath(moreOpen ? null : pathname)} className={`${linkClass(activeSecondary)} gap-2 ${moreOpen ? 'text-white' : ''}`}><span className="relative z-10">More <ChevronDown size={12} className={`inline transition-transform ${moreOpen ? 'rotate-180' : ''}`} /></span></button>
        <nav id="more-pages-navigation" aria-label="More pages" hidden={!moreOpen} className={`absolute right-0 top-[calc(100%+0.8rem)] z-30 w-56 flex-col border border-white/10 bg-[#050506]/98 p-3 shadow-[0_40px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl ${moreOpen ? 'flex' : 'hidden'}`}>{secondaryNavigation.map((item) => renderLink(item))}</nav>
      </div>
    </nav>

    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: .98 }} transition={{ duration: .16 }} className="relative z-10 hidden justify-self-end xl:block"><Link to="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} className={contactClass}>Contact <ArrowUpRight size={13} /></Link></motion.div>
    <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuPath(menuOpen ? null : pathname)} className="relative z-10 col-start-3 justify-self-end border border-white/15 p-2.5 text-white transition hover:border-[var(--color-accent)]/70 hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] xl:hidden">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
    <nav id="mobile-navigation" aria-label="Main navigation" hidden={!menuOpen} className={`absolute inset-x-3 top-[calc(100%+4px)] flex-col gap-1 border border-white/10 bg-[#050506]/98 p-4 shadow-[0_40px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl xl:hidden ${menuOpen ? 'flex' : 'hidden'}`}>{allNavigation.map((item) => renderLink(item, true))}<Link to="/contact" onClick={() => setMobileMenuPath(null)} aria-current={pathname === '/contact' ? 'page' : undefined} className={`mt-3 ${contactClass} w-full`}>Contact <ArrowUpRight size={14} /></Link></nav>
  </header>
}
export default SiteHeader
