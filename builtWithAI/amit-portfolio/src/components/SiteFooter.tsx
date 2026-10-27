import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { profile } from '../data/profile'

const currentYear = new Date().getFullYear()

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Experience', to: '/experience' },
  { label: 'Publications', to: '/publications' },
  { label: 'Endorsements', to: '/endorsements' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'About', to: '/about' },
  { label: 'Resume', to: '/resume' },
  { label: 'Contact', to: '/contact' },
]
function SiteFooter() {
  const socials = profile.links.filter((item) => item.footer && item.href.startsWith('https://'))
  return <footer className="mt-20 border-t border-white/10"><div className="section-wrap grid gap-8 py-10 lg:grid-cols-[1.2fr_1fr_1fr]">
    <div>
      <Link to="/" className="font-display text-2xl uppercase tracking-[0.28em] text-white">Amit<span className="text-[var(--color-accent)]">.</span></Link>
      <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">Aspiring AI Engineer building practical, reliable AI applications with a focus on applied systems.</p>
    </div>
    <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.26em] text-white/50">
      {footerLinks.map((item) => <Link key={item.to} className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" to={item.to}>{item.label}</Link>)}
    </nav>
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/30">Connect</p>
      <div className="flex flex-wrap items-center gap-4">
        {socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs text-white/60 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">{item.label}<ArrowUpRight size={12} /></a>)}
        {profile.email && <a href={`mailto:${profile.email}`} className="inline-flex min-h-9 items-center gap-1 text-xs text-white/60 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Email<ArrowUpRight size={12} /></a>}
        {profile.whatsappUrl && <a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs text-white/60 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">WhatsApp<ArrowUpRight size={12} /></a>}
      </div>
    </div>
    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/30 lg:col-span-3">© {currentYear} Amit Hasan Simanto</p>
  </div></footer>
}
export default SiteFooter
