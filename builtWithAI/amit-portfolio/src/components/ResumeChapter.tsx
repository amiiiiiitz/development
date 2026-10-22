import { motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpRight, FileText } from 'lucide-react'
import { profile } from '../data/profile'

function ResumeChapter() {
  const resumeUrl = profile.resumePdfUrl.trim()
  return (
    <section id="resume" aria-labelledby="resume-title" className="section-wrap py-14 sm:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .4, ease: 'easeOut' }} className="resume-panel grid gap-6 rounded-2xl border border-slate-300/20 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-9">
        <div aria-hidden="true" className="resume-mark grid h-16 w-16 place-items-center rounded-xl border border-cyan/20 bg-cyan/[.06] text-cyan"><FileText size={28} strokeWidth={1.3} /></div>
        <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">04 / Resume</p><h2 id="resume-title" className="mt-2 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">Resume</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/75">A concise document for education, explored skills, projects, and current learning.</p>{resumeUrl ? <p className="mt-3 text-xs text-emerald-200">Resume PDF available</p> : <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/[.07] px-3 py-1.5 font-mono text-[10px] text-amber-100">Resume PDF coming soon</p>}</div>
        <div className="flex flex-wrap gap-2 sm:flex-col">{resumeUrl ? <><a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">View Resume <ArrowUpRight size={14} /></a><a href={resumeUrl} download={profile.resumeFileName} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300/25 px-4 py-2.5 text-xs text-white/80 transition hover:border-cyan/45 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">Download PDF <ArrowDownToLine size={14} /></a></> : <span className="font-mono text-[9px] text-slate-200/55">Document not yet linked</span>}</div>
      </motion.div>
    </section>
  )
}

export default ResumeChapter