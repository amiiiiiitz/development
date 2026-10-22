import { motion } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import HomeChapters from '../components/HomeChapters'
import DashboardMetrics from '../components/DashboardMetrics'

const motionIn = { hidden: { opacity: 1, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: .3, ease: 'easeOut' as const } } }
function HomePage() {
  return <PageLayout><main id="home" className="relative min-h-screen overflow-x-clip">
    <section aria-labelledby="hero-title" className="relative mx-auto grid min-h-[min(700px,calc(100svh-76px))] w-full max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-16">
      <div aria-hidden="true" className="hero-orbit hero-orbit--one" />
      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .1 } } }} className="relative z-[1]">
        <motion.p variants={motionIn} className="mb-5 font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Amit Hasan Simanto / aspiring AI engineer</motion.p>
        <motion.h1 variants={motionIn} id="hero-title" className="max-w-3xl font-display text-[clamp(3rem,8vw,6.4rem)] font-medium leading-[.98] tracking-[-.065em] text-white">Building useful <span className="hero-gradient">AI-powered applications.</span></motion.h1>
        <motion.p variants={motionIn} className="mt-6 max-w-lg text-sm leading-7 text-white/70 sm:text-base sm:leading-8">A third-year CSE student at IUBAT, learning to build useful AI applications and agent workflows.</motion.p>
        <motion.div variants={motionIn} className="mt-8 flex flex-wrap items-center gap-3"><Link to="/projects" className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-semibold text-ink transition hover:bg-cyan">Explore Projects <ArrowUpRight size={15} /></Link><Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs text-white/80 transition hover:border-violet/50 hover:text-white">About me <ArrowRight size={14} /></Link><Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs text-white/80 transition hover:border-cyan/50 hover:text-white">Contact <ArrowRight size={14} /></Link></motion.div>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={motionIn} className="relative z-[1] mx-auto w-full max-w-lg"><DashboardMetrics /></motion.div>
      <a href="#projects" className="group absolute bottom-5 left-6 inline-flex items-center gap-3 font-mono text-[9px] uppercase tracking-[.18em] text-white/45 transition hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan sm:left-10 lg:left-16"><ArrowDown size={13} /> Continue <span className="h-px w-8 bg-white/20 transition-all group-hover:w-12 group-hover:bg-cyan/60" /></a>
    </section>
    <HomeChapters />
  </main></PageLayout>
}
export default HomePage
