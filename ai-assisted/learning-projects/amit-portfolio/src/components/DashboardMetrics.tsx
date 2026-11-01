import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { dashboardMetrics } from '../data/dashboard'

const reveal = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) return <span aria-hidden="true">{text}</span>

  return <motion.span aria-hidden="true" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { delayChildren: delay, staggerChildren: 0.025 } } }}>
    {Array.from(text).map((character, index) => <motion.span
      key={`${character}-${index}`}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }}
    >{character}</motion.span>)}
  </motion.span>
}

function DashboardMetrics() {
  return <section aria-labelledby="dashboard-title" className="mx-auto w-full max-w-xl">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)]">Live snapshot</p>
        <h2 id="dashboard-title" className="mt-3 font-display text-2xl uppercase tracking-[0.18em] text-white">Current record</h2>
      </div>
      <span className="mb-1 text-right font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Counted from<br />verified data</span>
    </div>
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .08, delayChildren: .16 } } }} className="border-y border-white/15">
      {dashboardMetrics.map((metric, index) => <motion.div key={metric.label} variants={reveal} transition={{ duration: .5, ease: 'easeOut' }}>
        <Link to={metric.href} className="group grid min-h-[4.25rem] grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-white/10 px-2 transition-colors last:border-b-0 hover:bg-white/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]">
          <span className="font-mono text-[9px] text-white/30">0{index + 1}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-white/65 transition-colors group-hover:text-white">
            <span className="sr-only">{metric.label}</span>
            <TypedText text={metric.label} delay={index * 0.12} />
          </span>
          <span className="flex items-center gap-3">
            <span className="sr-only">{String(metric.value).padStart(2, '0')}</span>
            <span className="font-display text-3xl leading-none text-white tabular-nums">
              <TypedText text={String(metric.value).padStart(2, '0')} delay={0.15 + index * 0.12} />
            </span>
            <ArrowUpRight aria-hidden="true" size={14} className="text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </span>
        </Link>
      </motion.div>)}
    </motion.div>
  </section>
}

export default DashboardMetrics
