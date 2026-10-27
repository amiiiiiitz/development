import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import AboutChapter from '../components/AboutChapter'

function AboutPage() {
  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">About</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Amit Hasan Simanto</h1>
        <p className="mt-4 text-[11px] uppercase tracking-[0.38em] text-white/40">Third-year CSE student at IUBAT · Aspiring AI Engineer</p>
      </section>
      <AboutChapter />
      <div className="section-wrap pb-16">
        <Link to="/contact" className="group inline-flex items-center gap-3 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">Get in touch <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
    </main>
  </PageLayout>
}

export default AboutPage