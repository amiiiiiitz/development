import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Mail } from 'lucide-react'
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
        {profile.email && <a href={`mailto:${profile.email}`} className="group mt-10 inline-flex items-center gap-3 border border-[var(--color-accent)] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-black">
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
        className="border border-white/10"
      >
        <div className="border-b border-white/10 p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-white/40">Channels</p>
        </div>
        <div className="divide-y divide-white/10">
          {profile.email && <motion.a href={`mailto:${profile.email}`} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="group flex items-center justify-between border-l-2 border-l-transparent p-6 transition hover:border-l-[var(--color-accent)] hover:bg-white/[0.02]">
            <div>
              <p className="text-lg text-white">Email</p>
              <p className="mt-1 text-sm text-white/50">{profile.email}</p>
            </div>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>}
          {profile.whatsappUrl && <motion.a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="group flex items-center justify-between border-l-2 border-l-transparent p-6 transition hover:border-l-[var(--color-accent)] hover:bg-white/[0.02]">
            <div>
              <p className="text-lg text-white">WhatsApp</p>
              <p className="mt-1 text-sm text-white/50">Message directly</p>
            </div>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>}
          {links.map((item) => item.href && <motion.a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="group flex items-center justify-between border-l-2 border-l-transparent p-6 transition hover:border-l-[var(--color-accent)] hover:bg-white/[0.02]">
            <p className="text-lg text-white">{item.label}</p>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </motion.a>)}
        </div>
      </motion.div>
    </div>
  </section>
}

export { ContactChapter }
export default ContactChapter
