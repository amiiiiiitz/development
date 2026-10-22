import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Braces, Check, CircleHelp, Compass, ExternalLink, Layers3, Sparkles } from 'lucide-react'
import TechnologyChips from './TechnologyChips'
import type { Project } from '../data/projects'
const storyFields: { label: string; icon: typeof CircleHelp; key: keyof NonNullable<Project['caseStudy']> }[] = [
  { label: 'The story', icon: BookOpen, key: 'story' },
  { label: 'Problem / need', icon: CircleHelp, key: 'problem' },
  { label: 'Intended solution', icon: Compass, key: 'intendedSolution' },
  { label: 'Engineering challenge', icon: Braces, key: 'challenge' },
  { label: 'Contribution', icon: Compass, key: 'contribution' },
  { label: 'Approach', icon: Compass, key: 'approach' },
  { label: 'Architecture', icon: Layers3, key: 'architecture' },
  { label: 'Implementation', icon: Braces, key: 'implementation' },
  { label: 'AI-assisted workflow', icon: Sparkles, key: 'aiWorkflow' },
  { label: 'Verification', icon: Check, key: 'verification' },
  { label: 'Results / current status', icon: Check, key: 'results' },
  { label: 'Lessons', icon: BookOpen, key: 'lessons' },
]
const reveal = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: .45, ease: 'easeOut' as const } } }

function safeExternalUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : undefined
  } catch {
    return undefined
  }
}

export function ProjectCaseStudy({ project, defaultOpen = false }: { project: Project; defaultOpen?: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const caseStudy = project.caseStudy
  const fields = storyFields.flatMap((field) => {
    const value = caseStudy?.[field.key]
    return typeof value === 'string' && value ? [{ ...field, value }] : []
  })

  useEffect(() => {
    const openMatchingCaseStudy = () => {
      if (window.location.hash === `#case-study-${project.slug}` && detailsRef.current) {
        detailsRef.current.open = true
      }
    }
    openMatchingCaseStudy()
    window.addEventListener('hashchange', openMatchingCaseStudy)
    return () => window.removeEventListener('hashchange', openMatchingCaseStudy)
  }, [project.slug])

  const resources = [
    { label: 'Live Demo', value: project.resources?.liveDemo, fallback: 'Not provided' },
    { label: 'Source Code', value: project.resources?.sourceCode, fallback: 'Coming Soon' },
    { label: 'README', value: project.resources?.readme, fallback: 'Not provided' },
  ].map((resource) => ({ ...resource, href: safeExternalUrl(resource.value) }))

  return (
    <motion.details ref={detailsRef} id={`case-study-${project.slug}`} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .08 }} open={defaultOpen} className="project-case-study group scroll-mt-8 overflow-hidden rounded-2xl border border-white/[.09] bg-[#0e0e14]">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 px-5 py-5 transition hover:bg-white/[.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan sm:px-7 [&::-webkit-details-marker]:hidden"><span><span className="block font-mono text-[8px] uppercase tracking-[.16em] text-white/40">{project.category} / {project.status}</span><span className="mt-2 block font-display text-lg font-medium text-white">{project.title}</span></span><span className="text-xs text-cyan">Case study details <span aria-hidden="true" className="ml-1 inline-block transition-transform group-open:rotate-45">+</span></span></summary>
      <div className="border-t border-white/[.07]">
        <div className="grid gap-px bg-white/[.06] sm:grid-cols-2">
          <div className="bg-[#0e0e14] p-5 sm:p-6"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">{project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technology direction'}</p><TechnologyChips items={project.stack} label={project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technology direction'} className="mt-3" /></div>
          <div className="bg-[#0e0e14] p-5 sm:p-6"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">Current evidence</p><p className="mt-3 text-xs leading-5 text-white/60">{caseStudy?.verification || 'No implementation or verification details have been documented.'}</p></div>
        </div>
        {fields.length > 0 && <div className="divide-y divide-white/[.07]">{fields.map((field) => { const Icon = field.icon; return <section key={field.key} className="grid gap-3 px-5 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8 sm:px-7"><h3 className="flex items-start gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-violet-100/75"><Icon size={13} className="shrink-0" />{field.label}</h3><p className="max-w-3xl text-xs leading-6 text-white/65">{field.value}</p></section> })}</div>}
        {caseStudy?.features?.length ? <section className="border-t border-white/[.07] px-5 py-5 sm:px-7"><h3 className="font-mono text-[9px] uppercase tracking-[.14em] text-cyan/80">{project.status === 'Planned' ? 'Planned scope' : 'Implemented features'}</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{caseStudy.features.map((feature) => <li key={feature} className="flex gap-2 text-xs leading-5 text-white/60"><span aria-hidden="true" className="text-cyan/60">·</span>{feature}</li>)}</ul></section> : null}
        {caseStudy?.decisions?.length ? <section className="border-t border-white/[.07] px-5 py-5 sm:px-7"><h3 className="font-mono text-[9px] uppercase tracking-[.14em] text-cyan/80">Decisions and trade-offs</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{caseStudy.decisions.map((item) => <article key={item.decision} className="rounded-xl border border-white/[.08] bg-black/10 p-4"><h4 className="text-xs font-medium text-white">{item.decision}</h4><p className="mt-2 text-xs leading-5 text-white/55">{item.reason}</p></article>)}</div></section> : null}
        {project.modulePhases?.length ? <section className="border-t border-white/[.07] px-5 py-5 sm:px-7"><h3 className="font-mono text-[9px] uppercase tracking-[.14em] text-cyan/80">Planned MVP sequence</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{project.modulePhases.map((phase) => <div key={phase.name} className="rounded-lg border border-white/[.08] bg-white/[.015] p-4"><h4 className="font-display text-xs font-medium text-white">{phase.name}</h4><ol className="mt-3 space-y-2">{phase.modules.map((module, index) => <li key={module} className="flex gap-3 text-[10px] leading-5 text-white/55"><span className="font-mono text-white/30">0{index + 1}</span>{module}</li>)}</ol></div>)}</div><p className="mt-4 text-[10px] leading-5 text-white/40">Authentication and basic role-based access control are foundational requirements. All modules and security foundations remain planned.</p></section> : null}
        {caseStudy?.limitations?.length ? <section className="border-t border-white/[.07] px-5 py-5 sm:px-7"><h3 className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">Limitations / unknowns</h3><ul className="mt-3 space-y-2">{caseStudy.limitations.map((item) => <li key={item} className="text-xs leading-5 text-white/55">{item}</li>)}</ul></section> : null}
        {caseStudy?.nextSteps?.length ? <section className="border-t border-white/[.07] px-5 py-5 sm:px-7"><h3 className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">Next steps</h3><ol className="mt-3 space-y-2">{caseStudy.nextSteps.map((item, index) => <li key={item} className="flex gap-3 text-xs leading-5 text-white/60"><span className="font-mono text-cyan/60">0{index + 1}</span>{item}</li>)}</ol></section> : null}
        <section id={`readme-${project.slug}`} className="border-t border-white/[.08] bg-black/15 px-5 py-5 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-violet-100/75">Project notes / README-style</p><h3 className="mt-2 font-display text-base font-medium text-white">{project.title}</h3></div><p className="text-[10px] text-white/40">Editable project notes · not a published repository README</p></div>{caseStudy?.setup?.length ? <div className="mt-5"><h4 className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">Local setup</h4><ol className="mt-2 flex flex-wrap gap-2">{caseStudy.setup.map((command) => <li key={command}><code className="inline-block rounded-md border border-white/[.08] bg-black/20 px-3 py-2 font-mono text-[10px] text-cyan/80">{command}</code></li>)}</ol></div> : <p className="mt-4 text-xs text-white/40">Setup instructions are not available for this planned concept.</p>}
          <div className="mt-5 flex flex-wrap gap-2">{resources.map((resource) => resource.href ? <a key={resource.label} href={resource.href} target="_blank" rel="noopener noreferrer" aria-label={`${resource.label} for ${project.title} (opens in a new tab)`} className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/[.06] px-3 py-2 text-[10px] font-medium text-cyan transition hover:border-cyan/55 hover:bg-cyan/[.1]">{resource.label}<ExternalLink size={12} /></a> : <span key={resource.label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/15 bg-slate-200/[.025] px-3 py-2 text-[10px] text-slate-200/65">{resource.label} <span aria-hidden="true">—</span> {resource.fallback || 'Not provided'}</span>)}</div>
        </section>
      </div>
    </motion.details>
  )
}

