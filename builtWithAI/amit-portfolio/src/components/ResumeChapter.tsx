import { motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpRight, FileText } from 'lucide-react'
import { profile } from '../data/profile'

function ResumeChapter() {
  const resumeUrl = profile.resumePdfUrl.trim()
  return (
    <section id="resume" aria-labelledby="resume-title" className="section-wrap py-14 sm:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .4, ease: 'easeOut' }} className="resume-panel grid gap-6 border p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-9">
        <div aria-hidden="true" className="resume-mark grid h-16 w-16 place-items-center border border-[var(--color-accent)]/30 text-[var(--color-accent)]"><FileText size={28} strokeWidth={1.3} /></div>
        <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--color-accent)]">04 / Resume</p><h2 id="resume-title" className="mt-2 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">Resume</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">A concise document for education, explored skills, projects, and current learning.</p>{resumeUrl ? <p className="mt-3 text-xs text-[var(--color-accent)]">Resume PDF available</p> : <p className="mt-3 inline-flex items-center gap-2 border border-[var(--color-accent)]/25 px-3 py-1.5 font-mono text-[10px] text-white/70">Resume PDF coming soon</p>}</div>
        <div className="flex flex-wrap gap-2 sm:flex-col">{resumeUrl ? <><a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">View Resume <ArrowUpRight size={14} /></a><a href={resumeUrl} download={profile.resumeFileName} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/20 px-4 py-2.5 text-xs text-white/80 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Download PDF <ArrowDownToLine size={14} /></a></> : <span className="font-mono text-[9px] text-white/55">Document not yet linked</span>}</div>
      </motion.div>
    </section>
  )
}

export default ResumeChapter