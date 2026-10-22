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
  return pathname === to || (to === '/projects' && pathname.startsWith('/projects/'))
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
    const closeOnDesktop = () => { if (window.innerWidth >= 1024) setMobileMenuPath(null) }
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
  const linkClass = (active: boolean) => `relative inline-flex min-h-9 items-center rounded-full px-2.5 py-2 text-[11px] transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan focus-visible:outline-offset-2 ${active ? 'text-white' : 'text-white/60'}`
  const contactClass = `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${pathname === '/contact' ? 'border-cyan/40 bg-cyan/[.06] text-cyan' : 'border-white/15 text-white/80 hover:border-cyan/50 hover:bg-cyan/[.06] hover:text-cyan'}`
  const renderLink = (item: (typeof allNavigation)[number], mobile = false) => {
    const active = isActiveRoute(pathname, item.to)
    return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} onClick={() => { setMobileMenuPath(null); setMoreOpenPath(null) }} className={mobile ? `rounded-lg px-3 py-3 text-sm transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${active ? 'text-cyan' : 'text-white/70'}` : linkClass(active)}>
      <span className={mobile ? '' : 'relative z-10'}>{item.label}</span>{active && !mobile && <motion.span layoutId="active-navigation-indicator" aria-hidden="true" className="absolute inset-0 z-0 rounded-full border border-white/[.13] bg-white/[.055]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
    </Link>
  }
  const activeSecondary = secondaryNavigation.some((item) => isActiveRoute(pathname, item.to))

  return <header className="relative z-20 mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between border-b border-white/[.07] px-5 sm:px-8 lg:px-12">
    <Link to="/" aria-label="Amit Hasan Simanto, aspiring AI engineer — home" className="group relative z-10 flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><span className="font-display text-lg font-semibold tracking-tight text-white">Amit<span className="text-cyan transition-colors group-hover:text-violet-200">.</span></span><span className="hidden border-l border-white/15 pl-2.5 text-[10px] text-white/50 sm:inline">Aspiring AI Engineer</span></Link>

    <nav aria-label="Main navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/[.12] bg-[#0c1119]/85 p-1 shadow-[0_10px_30px_rgba(0,0,0,.22)] backdrop-blur-md lg:flex">
      {primaryNavigation.map((item) => renderLink(item))}
      <div ref={moreRef} className="relative"><button type="button" aria-haspopup="true" aria-expanded={moreOpen} aria-controls="more-pages-navigation" onClick={() => setMoreOpenPath(moreOpen ? null : pathname)} className={`${linkClass(activeSecondary)} gap-1 ${moreOpen ? 'text-white' : ''}`}><span className="relative z-10">More <ChevronDown size={12} className={`inline transition-transform ${moreOpen ? 'rotate-180' : ''}`} /></span>{activeSecondary && <motion.span layoutId="active-navigation-indicator" aria-hidden="true" className="absolute inset-0 z-0 rounded-full border border-white/[.13] bg-white/[.055]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}</button>
        <nav id="more-pages-navigation" aria-label="More pages" hidden={!moreOpen} className={`absolute right-0 top-[calc(100%+0.6rem)] z-30 w-52 flex-col rounded-2xl border border-white/[.13] bg-[#10151f]/[.98] p-2 shadow-2xl backdrop-blur-xl ${moreOpen ? 'flex' : 'hidden'}`}>{secondaryNavigation.map((item) => renderLink(item))}</nav>
      </div>
    </nav>

    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: .98 }} transition={{ duration: .16 }} className="relative z-10 hidden lg:block"><Link to="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} className={contactClass}>Let’s Connect <ArrowUpRight size={13} /></Link></motion.div>
    <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuPath(menuOpen ? null : pathname)} className="relative z-10 rounded-full border border-white/15 p-2.5 text-white transition hover:border-cyan/40 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan lg:hidden">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
    <nav id="mobile-navigation" aria-label="Main navigation" hidden={!menuOpen} className={`absolute inset-x-4 top-[calc(100%-1px)] flex-col gap-1 rounded-b-2xl border border-t-0 border-white/10 bg-[#0b0f17]/[.98] p-4 shadow-2xl backdrop-blur-xl lg:hidden ${menuOpen ? 'flex' : 'hidden'}`}>{allNavigation.map((item) => renderLink(item, true))}<Link to="/contact" onClick={() => setMobileMenuPath(null)} aria-current={pathname === '/contact' ? 'page' : undefined} className={`mt-2 ${contactClass}`}>Let’s Connect <ArrowUpRight size={15} /></Link></nav>
  </header>
}
export default SiteHeader
