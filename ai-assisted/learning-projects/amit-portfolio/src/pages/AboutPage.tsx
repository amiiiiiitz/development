import { useState } from 'react'
import { ArrowUpRight, UserRound } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import AboutChapter, { ProfileChapter } from '../components/AboutChapter'
import { profile } from '../data/profile'

function AboutPage() {
  const [portraitUnavailable, setPortraitUnavailable] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return <PageLayout>
    <main className="min-h-[70vh]">
      <section id="about" aria-labelledby="about-title" className="section-wrap grid gap-10 pt-12 pb-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">About</p>
          <h1 id="about-title" className="mt-4 font-display text-[clamp(2.75rem,6vw,5.75rem)] uppercase leading-[0.92] tracking-tight text-white">Amit Hasan Simanto</h1>
          <p className="mt-4 text-[11px] uppercase tracking-[0.38em] text-white/40">Third-year CSE student at IUBAT · Aspiring AI Engineer</p>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
          whileInView={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [18, 0, -5, 0] }}
          viewport={{ once: true, amount: 0.25 }}
          transition={prefersReducedMotion ? { duration: 0 } : {
            opacity: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
            scale: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
            y: { duration: 1.8, times: [0, 0.4, 0.7, 1], ease: [0.25, 0.1, 0.25, 1] },
          }}
          className="relative mt-8 w-full max-w-sm"
        >
          <div className="flex min-h-64 items-center justify-center border border-white/10 p-2">
            {profile.portrait && !portraitUnavailable ? <img src={profile.portrait} alt={`Portrait of ${profile.name}`} onError={() => setPortraitUnavailable(true)} loading="lazy" decoding="async" className="block h-auto max-h-[34rem] w-auto max-w-full object-contain" /> : <div className="grid min-h-64 w-full place-items-center text-white/30"><UserRound size={28} /><span className="sr-only">Portrait unavailable</span></div>}
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-4">
            <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.34em] text-white/40">Portrait</span>
            <span className="min-w-0 break-words text-left font-mono text-[9px] uppercase leading-5 tracking-[0.34em] text-[var(--color-accent)] sm:text-right">{profile.direction}</span>
          </div>
        </motion.div>
        </div>
        <ProfileChapter />
      </section>
      <AboutChapter />
      <div className="section-wrap pb-16">
        <Link to="/contact" className="group inline-flex items-center gap-3 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">Get in touch <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
    </main>
  </PageLayout>
}

export default AboutPage