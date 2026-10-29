import { BriefcaseBusiness } from 'lucide-react'
import { motion } from 'motion/react'
import { experience } from '../data/profile'

function ExperienceChapter() {
  return <main className="section-wrap min-h-[72vh] py-14 sm:py-20">
    <header className="mb-10 max-w-3xl sm:mb-14">
      <p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Work history / verified only</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-[-.05em] text-white sm:text-6xl">Experience</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/70">A factual record of professional roles. Academic and personal projects are documented separately.</p>
    </header>

    {experience.length ? <div className="max-w-4xl border-l border-white/15 pl-6 sm:pl-8">{experience.map((item, index) => <motion.article key={`${item.organization}-${item.role}-${item.dates ?? index}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .4, delay: index * .06 }} className="relative border-b border-white/[.08] pb-7 last:border-0">
      <span aria-hidden="true" className="absolute -left-[calc(1.5rem+4px)] top-1.5 h-2 w-2 rounded-full border border-cyan bg-ink sm:-left-[calc(2rem+4px)]" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1"><h2 className="font-display text-lg font-medium text-white">{item.role} <span className="text-slate-200/65">· {item.organization}</span></h2>{item.dates && <p className="font-mono text-[10px] text-slate-200/50">{item.dates}</p>}</div>
      {item.description && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/65">{item.description}</p>}
    </motion.article>)}</div> : <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} aria-labelledby="experience-empty-title" className="relative max-w-4xl border-y border-white/10 py-8 sm:py-10">
      <div className="flex items-start gap-4"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-violet-200/20 bg-violet-200/[.04] text-violet-100/80"><BriefcaseBusiness size={17} /></span><div><h2 id="experience-empty-title" className="font-display text-lg font-medium text-white">A career still taking shape</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200/70">Professional experience will be added as I gain industry experience.</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[.14em] text-slate-200/40">Academic and personal projects remain in Projects</p></div></div>
    </motion.section>}
  </main>
}

export default ExperienceChapter
