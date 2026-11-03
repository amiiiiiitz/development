import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { dashboardMetrics } from '../data/dashboard'

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
  const prefersReducedMotion = useReducedMotion()

  return <section aria-labelledby="dashboard-title" className="mx-auto w-full max-w-xl">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)]">Live snapshot</p>
        <h2 id="dashboard-title" className="mt-3 font-display text-2xl uppercase tracking-[0.18em] text-white">Current record</h2>
      </div>
      <span className="mb-1 text-right font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Counted from<br />verified data</span>
    </div>
    <motion.div initial={prefersReducedMotion ? false : 'hidden'} animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : .12, delayChildren: prefersReducedMotion ? 0 : .16 } } }} className="grid min-w-0 gap-2">
      {dashboardMetrics.map((metric, index) => <motion.div key={metric.label} variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: prefersReducedMotion ? 0 : .42, ease: 'easeOut' }} className="min-w-0">
        <Link to={metric.href} className="touch-feedback group relative grid min-h-[4.25rem] min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.045] via-white/[0.025] to-transparent px-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30 hover:from-[var(--color-accent)]/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-black/20 font-mono text-[9px] text-[var(--color-accent)]/75 transition-colors group-hover:border-[var(--color-accent)]/25 group-hover:text-[var(--color-accent)]">0{index + 1}</span>
          <span className="min-w-0 text-[11px] uppercase tracking-[0.14em] text-white/65 transition-colors group-hover:text-white sm:text-xs">
            <span className="sr-only">{metric.label}</span>
            <TypedText text={metric.label} delay={index * 0.12} />
          </span>
          <span className="flex items-center gap-2 sm:gap-3">
            <span className="sr-only">{String(metric.value).padStart(2, '0')}</span>
            <span className="min-w-9 rounded-md bg-white/[0.05] px-2 py-1 text-center font-display text-2xl leading-none text-white tabular-nums transition-colors group-hover:bg-[var(--color-accent)]/10 sm:text-3xl">
              <TypedText text={String(metric.value).padStart(2, '0')} delay={0.15 + index * 0.12} />
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.08] text-white/30 transition group-hover:border-[var(--color-accent)]/30 group-hover:text-[var(--color-accent)]"><ArrowUpRight aria-hidden="true" size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </span>
        </Link>
      </motion.div>)}
    </motion.div>
  </section>
}

export default DashboardMetrics
