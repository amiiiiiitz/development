import { ArrowUpRight, Code2, Link2, Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { profile } from '../data/profile'

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function validExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function ContactChapter() {
  const availableLinks = profile.links.filter((item) => item.href && validExternalUrl(item.href))
  return (
    <section id="contact" aria-labelledby="contact-story-title" className="section-wrap pb-24 pt-8 sm:pb-32">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={reveal} className="contact-panel relative overflow-hidden rounded-2xl border border-violet/20 bg-[#101018] px-6 py-12 sm:px-10 sm:py-14 lg:px-14">
        <div aria-hidden="true" className="contact-glow pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet/[.08] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="mb-4 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[.22em] text-cyan"><span className="h-px w-6 bg-cyan/50" />06 / The next conversation</p><h1 id="contact-story-title" className="max-w-2xl font-display text-3xl font-medium leading-tight tracking-[-.045em] text-white sm:text-5xl">Contact & Social Links</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/70">I am open to learning, building, and collaborating with people interested in AI and software development.</p></div>
          <div className="relative min-w-0 lg:min-w-[20rem]"><p className="mb-3 font-mono text-[8px] uppercase tracking-[.18em] text-slate-200/65">Connect and coding practice</p>
            {availableLinks.length > 0 ? <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{availableLinks.map((item) => { const Icon = item.label === 'Codeforces' ? Code2 : Link2; return <li key={item.label}><a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} (opens in a new tab)`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300/20 bg-slate-200/[.04] px-3 py-2.5 text-xs text-slate-100/85 transition hover:border-cyan/45 hover:bg-cyan/[.07] hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><Icon size={14} aria-hidden="true" />{item.label}<ArrowUpRight size={12} className="ml-auto" /></a></li> })}</ul> : <p className="max-w-sm text-xs leading-5 text-white/60">Email and profile links have not been added yet.</p>}
            <div className="mt-4 border-t border-white/[.1] pt-4">
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[.18em] text-slate-200/65">Direct contact</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {profile.email && <a href={`mailto:${profile.email}`} aria-label={`Email Me: ${profile.email}`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300/20 bg-slate-200/[.04] px-3 py-2.5 text-xs text-slate-100/85 transition hover:border-cyan/45 hover:bg-cyan/[.07] hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><Mail size={14} aria-hidden="true" /><span><span className="block">Email Me</span><span className="mt-0.5 block text-[10px] text-slate-200/55">{profile.email}</span></span><ArrowUpRight size={12} className="ml-auto" /></a>}
                {profile.whatsappUrl && <a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Me (opens in a new tab)" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300/20 bg-slate-200/[.04] px-3 py-2.5 text-xs text-slate-100/85 transition hover:border-cyan/45 hover:bg-cyan/[.07] hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><MessageCircle size={14} aria-hidden="true" /><span>WhatsApp Me</span><ArrowUpRight size={12} className="ml-auto" /></a>}
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/[.12] pt-5"><p className="font-mono text-[9px] text-slate-200/65">Thanks for taking a look.</p><Link to="/projects" className="group inline-flex items-center gap-2 text-xs text-cyan transition hover:text-white">Explore project notes <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1" /></Link></div>
      </motion.div>
    </section>
  )
}

export { ContactChapter }
