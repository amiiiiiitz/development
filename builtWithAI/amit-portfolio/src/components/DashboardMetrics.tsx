import { motion } from 'motion/react'
import { ArrowUpRight, ChartNoAxesColumnIncreasing } from 'lucide-react'
import { Link } from 'react-router'
import { dashboardMetrics } from '../data/dashboard'

const reveal = { hidden: { opacity: 1, y: 6 }, visible: { opacity: 1, y: 0 } }

function DashboardMetrics() {
  return <section aria-labelledby="dashboard-title" className="mx-auto w-full max-w-lg">
    <div className="mb-4 flex items-end justify-between gap-3"><div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-cyan">Current snapshot</p><h2 id="dashboard-title" className="mt-1 font-display text-lg font-medium text-white">Personal dashboard</h2></div><ChartNoAxesColumnIncreasing aria-hidden="true" size={17} className="mb-1 text-violet-200/65" /></div>
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .06, delayChildren: .12 } } }} className="grid grid-cols-2 gap-2 sm:gap-3">
      {dashboardMetrics.map((metric, index) => <motion.div key={metric.label} variants={reveal} transition={{ duration: .32, ease: 'easeOut' }} className={index === dashboardMetrics.length - 1 ? 'col-span-2' : ''}>
        <Link to={metric.href} className="group flex min-h-[5.6rem] h-full items-center justify-between gap-3 rounded-xl border border-white/[.11] bg-[#0d131d]/75 px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan/35 hover:bg-[#111b27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan focus-visible:outline-offset-2 motion-reduce:transform-none">
          <span className="min-w-0"><span className="block font-mono text-[8px] uppercase tracking-[.15em] text-slate-200/55">{metric.label}</span><span className="mt-1 block font-display text-2xl font-medium leading-none text-white tabular-nums">{metric.value.toString().padStart(2, '0')}</span></span>
          <ArrowUpRight aria-hidden="true" size={14} className="shrink-0 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
        </Link>
      </motion.div>)}
    </motion.div>
  </section>
}

export default DashboardMetrics
