import { ArrowUpRight, Mail } from 'lucide-react'
import { profile } from '../data/profile'

function ContactChapter() {
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
      <div className="border border-white/10">
        <div className="border-b border-white/10 p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-white/40">Channels</p>
        </div>
        <div className="divide-y divide-white/10">
          {profile.email && <a href={`mailto:${profile.email}`} className="group flex items-center justify-between p-6 transition hover:bg-white/[0.02]">
            <div>
              <p className="text-lg text-white">Email</p>
              <p className="mt-1 text-sm text-white/50">{profile.email}</p>
            </div>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </a>}
          {profile.whatsappUrl && <a href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-6 transition hover:bg-white/[0.02]">
            <div>
              <p className="text-lg text-white">WhatsApp</p>
              <p className="mt-1 text-sm text-white/50">Message directly</p>
            </div>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </a>}
          {links.map((item) => item.href && <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-6 transition hover:bg-white/[0.02]">
            <p className="text-lg text-white">{item.label}</p>
            <ArrowUpRight size={16} className="text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </a>)}
        </div>
      </div>
    </div>
  </section>
}

export { ContactChapter }
export default ContactChapter
