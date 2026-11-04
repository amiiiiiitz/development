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
    <article className="touch-feedback group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.035),transparent_42%),#0b0b0b] shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/30 hover:shadow-[0_26px_70px_rgba(0,0,0,0.35)]">
      <div className="relative flex min-h-[16rem] flex-col justify-between overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_75%_35%,rgba(217,181,76,0.12),transparent_42%),linear-gradient(120deg,rgba(255,255,255,0.025),transparent_55%)] p-6 sm:min-h-[18rem] sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 select-none font-display text-[13rem] leading-none text-white/[0.035] transition-colors duration-500 group-hover:text-[var(--color-accent)]/[0.09] sm:text-[15rem]">{project.number}</span>
        <div className="relative flex items-start gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-black/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Project {project.number}</span>
            <span className={`rounded-full border bg-black/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${statusStyles[project.status]}`}>{project.status}</span>
          </div>
        </div>
        <div className="relative mt-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-accent)]/75">{project.category}</p>
          <h3 className="mt-3 max-w-[14ch] font-display text-[clamp(2.2rem,5vw,4rem)] uppercase leading-[0.94] tracking-tight text-white">{project.title}</h3>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">{project.subtitle}</p>
        </div>
        <div aria-hidden="true" className="absolute bottom-8 right-8 hidden items-end gap-1 opacity-40 sm:flex">
          <span className="h-5 w-1 rounded-full bg-[var(--color-accent)]/35" />
          <span className="h-9 w-1 rounded-full bg-[var(--color-accent)]/50" />
          <span className="h-6 w-1 rounded-full bg-[var(--color-accent)]/30" />
          <span className="h-12 w-1 rounded-full bg-[var(--color-accent)]/60" />
          <span className="h-8 w-1 rounded-full bg-[var(--color-accent)]/40" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="flex-1 text-sm leading-7 text-white/65 sm:text-base sm:leading-8">{project.description}</p>
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{project.technologyStatus === 'Used' ? 'Technology used' : 'Planned technology'}</p>
        <TechnologyChips items={project.stack} label={project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technologies'} className="mt-6" />
        {project.resources && <div className="mt-6 flex flex-wrap gap-2">
          {project.resources.liveDemo && <a href={project.resources.liveDemo} target="_blank" rel="noopener noreferrer" aria-label="Live Demo (opens in a new tab)" className="ui-button ui-button--accent min-h-9 shrink-0 whitespace-nowrap px-3 py-2 text-[10px]"><ExternalLink size={13} />Live Demo</a>}
          {project.resources.sourceCode && <a href={project.resources.sourceCode} target="_blank" rel="noopener noreferrer" aria-label="Source Code (opens in a new tab)" className="ui-button min-h-9 shrink-0 whitespace-nowrap px-3 py-2 text-[10px]"><Code2 size={13} />Source Code</a>}
          {project.resources.readme && <a href={project.resources.readme} target="_blank" rel="noopener noreferrer" aria-label="README (opens in a new tab)" className="ui-button min-h-9 shrink-0 whitespace-nowrap px-3 py-2 text-[10px]"><BookOpen size={13} />README</a>}
        </div>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
          <span className="inline-flex items-center gap-2 text-xs text-white/45"><span className={`h-1.5 w-1.5 rounded-full ${project.status === 'Built' ? 'bg-emerald-300/70' : project.status === 'In Progress' ? 'bg-[var(--color-accent)]' : 'bg-white/30'}`} />{project.status === 'Planned' ? 'Concept in planning' : project.status === 'Built' ? 'Built project' : 'In development'}</span>
          {detailsHref ? <Link to={detailsHref} className="ui-button group/detail min-h-10 px-4 py-2 text-[10px] uppercase tracking-[0.16em]">Case study <ArrowUpRight size={14} className="transition-transform group-hover/detail:-translate-y-0.5 group-hover/detail:translate-x-0.5" /></Link> : <ArrowUpRight size={16} className="text-white/30" />}
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
