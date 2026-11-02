import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Code2, Mail, MessageCircle } from 'lucide-react'
import { profile } from '../data/profile'

function ContactChapter() {
  const prefersReducedMotion = useReducedMotion()
  const links = [
    { label: 'LinkedIn', href: profile.links.find((item) => item.label === 'LinkedIn')?.href },
    { label: 'GitHub', href: profile.links.find((item) => item.label === 'GitHub')?.href },
    { label: 'Codeforces', href: profile.links.find((item) => item.label === 'Codeforces')?.href },
    { label: 'LeetCode Practice — Move Zeroes', href: profile.links.find((item) => item.label.includes('LeetCode'))?.href },
  ].filter((item) => item.href)

  return <section className="section-wrap py-12 sm:py-16">
    <div className="grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">Get in touch</p>
        <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.94] text-white">Open to conversation</h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/65">Focused on practical AI applications, agent workflows, and reliable software.</p>
        {profile.email && <a href={`mailto:${profile.email}`} className="ui-button ui-button--accent group mt-10 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">
          <Mail size={16} />
          Email
          <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>}
      </div>
      <motion.div
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.035] via-transparent to-[var(--color-accent)]/[0.035] p-2 sm:p-3"
      >
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-4 sm:px-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)]">Contact list</p>
            <p className="mt-1 text-xs text-white/45">Choose a channel to connect</p>
          </div>
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_14px_rgba(217,181,76,0.65)]" />
        </div>
        <div className="grid gap-2 p-1 pt-2">
          {profile.email && <motion.a href={`mailto:${profile.email}`} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="touch-feedback group flex min-h-[76px] items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] sm:px-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-white/55 transition-colors group-hover:border-[var(--color-accent)]/25 group-hover:text-[var(--color-accent)]"><Mail size={17} /></span>
              <div className="min-w-0"><p className="text-sm font-medium text-white">Email</p><p className="mt-1 truncate text-xs text-white/45">{profile.email}</p></div>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>}
          {profile.whatsappUrl && <motion.a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="touch-feedback group flex min-h-[76px] items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] sm:px-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-white/55 transition-colors group-hover:border-[var(--color-accent)]/25 group-hover:text-[var(--color-accent)]"><MessageCircle size={17} /></span>
              <div><p className="text-sm font-medium text-white">WhatsApp</p><p className="mt-1 text-xs text-white/45">Message directly</p></div>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>}
          {links.map((item) => item.href && <motion.a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="touch-feedback group flex min-h-[76px] items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] sm:px-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-white/55 transition-colors group-hover:border-[var(--color-accent)]/25 group-hover:text-[var(--color-accent)]"><Code2 size={17} /></span>
              <div className="min-w-0"><p className="text-sm font-medium text-white">{item.label}</p><p className="mt-1 truncate text-xs text-white/45">{item.label === 'LeetCode Practice — Move Zeroes' ? 'Problem-solving profile' : 'Professional profile'}</p></div>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>)}
        </div>
      </motion.div>
    </div>
  </section>
}

export { ContactChapter }
export default ContactChapter
