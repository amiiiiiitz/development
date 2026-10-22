import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { profile } from '../data/profile'

const currentYear = new Date().getFullYear()

const footerLinks = [
  { label: 'Home', to: '/' }, { label: 'Experience', to: '/experience' }, { label: 'Projects', to: '/projects' },
  { label: 'Publications', to: '/publications' }, { label: 'Endorsements', to: '/endorsements' },
  { label: 'Achievements', to: '/achievements' }, { label: 'About', to: '/about' },
  { label: 'Resume', to: '/resume' }, { label: 'Contact', to: '/contact' },
]
function SiteFooter() {
  const socials = profile.links.filter((item) => item.footer && item.href.startsWith('https://'))
  return <footer className="border-t border-white/[.1] bg-transparent"><div className="section-wrap grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
    <div><Link to="/" className="font-display text-base font-semibold tracking-tight text-white">Amit<span className="text-cyan">.</span></Link><p className="mt-1 text-xs text-slate-200/55">Learning in public.</p></div>
    <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-200/65">{footerLinks.map((item) => <Link key={item.to} className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan" to={item.to}>{item.label}</Link>)}</nav>
    <div className="flex flex-wrap items-center gap-4 sm:col-span-2">{socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-[10px] text-slate-200/65 transition hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">{item.label}<ArrowUpRight size={11} /></a>)}{profile.email && <a href={`mailto:${profile.email}`} className="inline-flex min-h-9 items-center gap-1 text-[10px] text-slate-200/65 transition hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">Email<ArrowUpRight size={11} /></a>}{profile.whatsappUrl && <a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-[10px] text-slate-200/65 transition hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">WhatsApp<ArrowUpRight size={11} /></a>}</div>
    <p className="font-mono text-[9px] text-slate-200/45 sm:col-span-2">© {currentYear} Amit Hasan Simanto. Built as a learning portfolio.</p>
  </div></footer>
}
export default SiteFooter
