import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import HomeChapters from '../components/HomeChapters'
import DashboardMetrics from '../components/DashboardMetrics'

const motionIn = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: .5, ease: [0.25, 0.1, 0.25, 1] as const } } }

function HomePage() {
  return <PageLayout><main id="home" className="relative min-h-screen overflow-x-clip">
    <section aria-labelledby="hero-title" className="relative mx-auto grid min-h-[min(880px,calc(100svh-82px))] w-full max-w-[86rem] items-center gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-24 hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(217,181,76,0.12),transparent_70%)] blur-3xl lg:block" />
      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .09 } } }} className="relative z-[1]">
        <motion.p variants={motionIn} className="mb-6 font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Aspiring AI Engineer / CSE Student</motion.p>
        <motion.h1 variants={motionIn} id="hero-title" aria-label="Amit Hasan Simanto" className="font-display text-[clamp(3.7rem,11vw,8.75rem)] uppercase leading-[0.78] tracking-[-0.02em] text-white">
          <span className="block">Amit Hasan</span>
          {' '}
          <span className="mt-2 block font-[var(--font-serif)] text-[0.72em] font-normal italic normal-case tracking-[-0.04em] text-[var(--color-accent)]">Simanto</span>
        </motion.h1>
        <motion.h2 variants={motionIn} className="mt-8 max-w-2xl font-display text-[clamp(2rem,4vw,3.3rem)] uppercase leading-[0.96] text-white">Building practical <span className="font-[var(--font-serif)] font-normal italic normal-case text-white/75">AI applications.</span></motion.h2>
        <motion.p variants={motionIn} className="mt-5 max-w-xl text-base leading-8 text-white/65 sm:text-lg">Third-year Computer Science and Engineering student at IUBAT, learning to bring Python, AI integrations, RAG, and agent workflows into useful software.</motion.p>
        <motion.div variants={motionIn} className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/projects" className="group inline-flex items-center gap-3 border border-[var(--color-accent)] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-black">Explore Projects <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
          <Link to="/contact" className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white/80 transition hover:border-white hover:text-white">Contact <ArrowRight size={14} /></Link>
        </motion.div>
        <motion.div variants={motionIn} className="mt-12 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.36em] text-white/30">
          <span>Applied AI</span>
          <span className="h-px w-10 bg-white/10" />
          <span>RAG</span>
          <span className="h-px w-10 bg-white/10" />
          <span>AI Agents</span>
          <span className="h-px w-10 bg-white/10" />
          <span>Python</span>
        </motion.div>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={motionIn} className="relative z-[1] mx-auto w-full max-w-xl lg:justify-self-end">
        <DashboardMetrics />
      </motion.div>
      <a href="#projects-preview" className="group absolute bottom-6 left-4 inline-flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.32em] text-white/40 transition hover:text-[var(--color-accent)] sm:left-8 lg:left-10">
        <span className="h-px w-8 bg-white/15 transition-all group-hover:w-12 group-hover:bg-[var(--color-accent)]/70" />
        Scroll
      </a>
    </section>
    <section id="projects-preview" className="section-wrap pb-16 sm:pb-24">
      <div className="mb-10 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">Selected Work</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] uppercase tracking-tight text-white">Projects</h2>
        </div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60 transition hover:text-[var(--color-accent)]">View archive <ArrowUpRight size={14} /></Link>
      </div>
      <HomeChapters />
    </section>
  </main></PageLayout>
}

export default HomePage
