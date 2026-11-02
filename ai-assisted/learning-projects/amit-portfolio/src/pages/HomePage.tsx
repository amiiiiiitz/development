import { motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import HomeChapters from '../components/HomeChapters'
import DashboardMetrics from '../components/DashboardMetrics'
import { profile } from '../data/profile'

const motionIn = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: .5, ease: [0.25, 0.1, 0.25, 1] as const } } }

function HomePage() {
  const [resumeUnavailableMessage, setResumeUnavailableMessage] = useState(false)
  const resumeUrl = profile.resumePdfUrl.trim()

  return <PageLayout><main id="home" className="relative min-h-screen overflow-x-clip">
    <section aria-labelledby="hero-title" className="relative mx-auto grid min-h-[min(880px,calc(100svh-82px))] w-full max-w-[86rem] items-center gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-16 block h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,181,76,0.1),transparent_70%)] blur-3xl sm:-left-40 sm:top-24 sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]" />
      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .09 } } }} className="relative z-[1]">
        <motion.p variants={motionIn} className="mb-6 font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Aspiring AI Engineer / CSE Student</motion.p>
        <h1
          id="hero-title"
          aria-label="Amit Hasan Simanto"
          className="font-display text-[clamp(2.2rem,7.2vw,6.4rem)] uppercase leading-[0.86] tracking-[-0.02em] text-white"
        >
          <span className="block whitespace-nowrap">
            Amit Hasan
          </span>
          {' '}
          <span className="mt-2 block font-[var(--font-serif)] text-[0.72em] font-normal italic leading-[0.95] tracking-[-0.04em] text-[var(--color-accent)]">Simanto</span>
        </h1>
        <motion.h2 variants={motionIn} className="mt-8 max-w-2xl font-display text-[clamp(2rem,4vw,3.3rem)] uppercase leading-[0.96] text-white">Building practical <span className="font-[var(--font-serif)] font-normal italic normal-case text-white/75">AI applications.</span></motion.h2>
        <motion.div variants={motionIn} className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/projects" className="ui-button ui-button--accent group px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Explore Projects <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
          <div className="relative">
            {resumeUrl ? <a href={resumeUrl} download={profile.resumeFileName} className="ui-button px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Download Resume <ArrowDownToLine size={14} /></a> : <button type="button" onClick={() => setResumeUnavailableMessage(true)} aria-describedby={resumeUnavailableMessage ? 'resume-unavailable-message' : undefined} className="ui-button px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Download Resume <ArrowDownToLine size={14} /></button>}
            {resumeUnavailableMessage && <p id="resume-unavailable-message" role="status" className="absolute left-0 top-full mt-2 whitespace-nowrap font-mono text-[10px] text-white/60">My resume will be added soon.</p>}
          </div>
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
    <HomeChapters />
  </main></PageLayout>
}

export default HomePage
