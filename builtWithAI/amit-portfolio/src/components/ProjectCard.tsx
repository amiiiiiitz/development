import { ArrowUpRight, BookOpen, Code2, ExternalLink } from 'lucide-react'
import type { Project, ProjectStatus } from '../data/projects'
import { Link } from 'react-router'
import TechnologyChips from './TechnologyChips'

const statusStyles: Record<ProjectStatus, string> = {
  Built: 'border-[var(--color-accent)]/60 text-[var(--color-accent)]',
  'In Progress': 'border-white/40 text-white/80',
  Planned: 'border-white/25 text-white/50',
}

function ProjectCard({ project, detailsHref }: { project: Project; detailsHref?: string }) {
  return (
    <article className="group flex h-full min-w-0 flex-col border border-white/10 transition duration-500 hover:-translate-y-1 hover:border-[var(--color-accent)]/45">
      <div className="relative flex min-h-[16rem] flex-col justify-between overflow-hidden border-b border-white/10 p-6 sm:min-h-[18rem] sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-10 font-display text-[15rem] leading-none text-white/[0.025] transition-colors duration-500 group-hover:text-[var(--color-accent)]/[0.08]">{project.number}</span>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(217,181,76,0.045),transparent_48%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-white/40">Project {project.number}</span>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">{project.category}</p>
          </div>
          <span className={`shrink-0 border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.3em] ${statusStyles[project.status]}`}>{project.status}</span>
        </div>
        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">{project.subtitle}</p>
          <h3 className="mt-4 max-w-[14ch] font-display text-[clamp(2.2rem,5vw,4rem)] uppercase leading-[0.94] tracking-tight text-white">{project.title}</h3>
        </div>
        <div className="relative flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/45">{project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technologies'}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">Case study</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t border-white/10 p-6 sm:p-8">
        <p className="flex-1 text-base leading-8 text-white/65">{project.description}</p>
        <TechnologyChips items={project.stack} label={project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technologies'} className="mt-6" />
        {project.resources && <div className="mt-6 flex flex-wrap gap-2">
          {project.resources.liveDemo && <a href={project.resources.liveDemo} target="_blank" rel="noopener noreferrer" aria-label="Live Demo (opens in a new tab)" className="inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap border border-[var(--color-accent)]/45 px-3 py-2 text-[10px] font-medium text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/75 hover:bg-[var(--color-accent)]/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><ExternalLink size={13} />Live Demo</a>}
          {project.resources.sourceCode && <a href={project.resources.sourceCode} target="_blank" rel="noopener noreferrer" aria-label="Source Code (opens in a new tab)" className="inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap border border-white/15 px-3 py-2 text-[10px] text-white/70 transition hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><Code2 size={13} />Source Code</a>}
          {project.resources.readme && <a href={project.resources.readme} target="_blank" rel="noopener noreferrer" aria-label="README (opens in a new tab)" className="inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap border border-white/15 px-3 py-2 text-[10px] text-white/70 transition hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><BookOpen size={13} />README</a>}
        </div>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <span className="text-sm text-white/50">{project.status === 'Planned' ? 'Concept in planning' : project.status === 'Built' ? 'Built project' : 'In development'}</span>
          {detailsHref ? <Link to={detailsHref} className="group/detail inline-flex min-h-10 items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/70 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Case study <ArrowUpRight size={14} className="transition-transform group-hover/detail:-translate-y-0.5 group-hover/detail:translate-x-0.5" /></Link> : <ArrowUpRight size={16} className="text-white/30" />}
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
