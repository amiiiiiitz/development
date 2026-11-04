import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import ThemeToggle from './ThemeToggle'

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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
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
  const linkClass = (active: boolean) => `relative inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 ${active ? 'bg-white/[0.08] text-[var(--color-accent)]' : 'text-white/55 hover:bg-white/[0.05] hover:text-white'}`
  const contactClass = `ui-button min-h-10 px-4 py-2 text-[10px] uppercase tracking-[0.18em] ${pathname === '/contact' ? 'ui-button--accent' : ''}`
  const renderLink = (item: (typeof allNavigation)[number], mobile = false) => {
    const active = isActiveRoute(pathname, item.to)
    return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} data-active={active || undefined} onClick={() => { setMobileMenuPath(null); setMoreOpenPath(null) }} className={mobile ? `flex min-h-11 items-center rounded-lg border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.08] text-[var(--color-accent)]' : 'border-transparent text-white/65 hover:bg-white/[0.05] hover:text-white'}` : linkClass(active)}>
      {item.label}
    </Link>
  }
  const activeSecondary = secondaryNavigation.some((item) => isActiveRoute(pathname, item.to))
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const toggleTheme = () => {
    document.documentElement.dataset.theme = nextTheme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', nextTheme === 'light' ? '#f7f6f1' : '#070707')
    setTheme(nextTheme)
    try {
      window.localStorage.setItem('amit-portfolio-theme', nextTheme)
    } catch (error) {
      console.error('Unable to save the theme preference.', error)
    }
  }
  const themeToggle = <ThemeToggle theme={theme} onToggle={toggleTheme} />

  return <header className="sticky top-0 z-40 mx-auto grid h-[72px] w-full max-w-[82rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-white/[0.06] bg-[#070707]/90 px-3 backdrop-blur-md sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1.05fr)_auto_minmax(0,0.95fr)]">
    <Link to="/" aria-label="Amit Hasan Simanto, aspiring AI engineer — home" className="group relative z-10 flex min-w-0 shrink-0 items-center gap-3 justify-self-start whitespace-nowrap"><span className="font-display text-xl font-semibold uppercase tracking-[0.28em] text-white">Amit<span className="text-[var(--color-accent)]">.</span></span><span className="hidden border-l border-white/15 pl-3 text-[9px] uppercase tracking-[0.32em] text-white/40 sm:inline">Aspiring AI Engineer</span></Link>

    <nav aria-label="Main navigation" className="hidden min-w-0 items-center justify-self-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.025] p-1 xl:flex">
      {primaryNavigation.map((item) => renderLink(item))}
      <div ref={moreRef} className="relative">
        <button type="button" aria-haspopup="true" aria-expanded={moreOpen} aria-controls="more-pages-navigation" data-active={activeSecondary || undefined} onClick={() => setMoreOpenPath(moreOpen ? null : pathname)} className={`${linkClass(activeSecondary)} gap-2 ${moreOpen ? 'text-white' : ''}`}><span className="relative z-10">More <ChevronDown size={12} className={`inline transition-transform ${moreOpen ? 'rotate-180' : ''}`} /></span></button>
        <nav id="more-pages-navigation" aria-label="More pages" hidden={!moreOpen} className={`absolute right-0 top-[calc(100%+0.8rem)] z-30 w-56 flex-col gap-1 rounded-xl border border-white/10 bg-[#101010]/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl ${moreOpen ? 'flex' : 'hidden'}`}>{secondaryNavigation.map((item) => renderLink(item, true))}</nav>
      </div>
    </nav>

    <div className="relative z-10 col-start-2 justify-self-end xl:hidden">{themeToggle}</div>
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: .98 }} transition={{ duration: .16 }} className="relative z-10 hidden items-center gap-2 justify-self-end xl:flex">{themeToggle}<Link to="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} className={contactClass}>Contact <ArrowUpRight size={13} /></Link></motion.div>
    <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuPath(menuOpen ? null : pathname)} className="ui-icon-button relative z-10 col-start-3 justify-self-end xl:hidden">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
    <nav id="mobile-navigation" aria-label="Main navigation" hidden={!menuOpen} className={`absolute inset-x-3 top-[calc(100%+4px)] flex-col gap-1 rounded-2xl border border-white/10 bg-[#101010]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl xl:hidden ${menuOpen ? 'flex' : 'hidden'}`}>{allNavigation.map((item) => renderLink(item, true))}<Link to="/contact" onClick={() => setMobileMenuPath(null)} aria-current={pathname === '/contact' ? 'page' : undefined} className={`mt-2 w-full ${contactClass}`}>Contact <ArrowUpRight size={14} /></Link></nav>
  </header>
}
export default SiteHeader
