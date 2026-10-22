import { ArrowUpRight, Bot, Building2, Database, FileText, Layers3, LayoutTemplate, Search, Wrench } from 'lucide-react'
import type { Project, ProjectStatus } from '../data/projects'
import { Link } from 'react-router'
import TechnologyChips from './TechnologyChips'

function ProjectPreview({ project }: { project: Project }) {
  if (project.visual === 'portfolio') {
    return <div aria-hidden="true" className="preview-window preview-window--portfolio"><div className="preview-top"><span /><span /><span /><i>PORTFOLIO / STORY</i></div><div className="preview-portfolio"><div className="preview-portfolio-nav"><b>AS.</b><span>PROJECTS</span><span>ABOUT</span><i>CONTACT</i></div><div className="preview-portfolio-copy"><small>AI ENGINEERING / PORTFOLIO</small><b>From code<br />to useful systems.</b><span>Projects · learning · direction</span></div><div className="preview-portfolio-strip"><span><LayoutTemplate size={10} /> PROJECT STORIES</span><span>STATUS / EVIDENCE</span></div></div></div>
  }
  if (project.visual === 'erp') {
    return <div aria-hidden="true" className="preview-window preview-window--erp"><div className="preview-top"><span /><span /><span /><i>PROPERTY / OVERVIEW</i></div><div className="preview-erp"><div className="preview-rail"><Building2 size={12} /><span /><span /><span /></div><div className="preview-body"><div className="preview-title"><b>Portfolio overview</b><small>Workspace concept</small></div><div className="preview-metrics"><div><small>UNITS</small><b>•••</b></div><div><small>OCCUPANCY</small><b>—</b></div><div><small>ACTIVITY</small><b>••</b></div></div><div className="preview-chart"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></div></div></div>
  }
  if (project.visual === 'agent') {
    return <div aria-hidden="true" className="preview-window preview-window--agent"><div className="preview-top"><span /><span /><span /><i>AGENT / TOOL FLOW</i></div><div className="preview-agent"><div className="preview-prompt"><Bot size={13} /><span>Task request</span><b>Plan a useful next step</b></div><div className="preview-tool-row"><span><Wrench size={12} /> tool choice</span><span className="preview-dash" /><span><Layers3 size={12} /> action</span></div><div className="preview-result"><span className="preview-dot" />Result returned for review</div></div></div>
  }
  return <div aria-hidden="true" className="preview-window preview-window--rag"><div className="preview-top"><span /><span /><span /><i>KNOWLEDGE / RETRIEVAL</i></div><div className="preview-rag"><div className="preview-search"><Search size={12} /><span>Ask the knowledge base…</span><b>↵</b></div><div className="preview-source"><FileText size={13} /><span><b>Relevant source</b><small>Retrieved passage · reference</small></span><i>01</i></div><div className="preview-answer"><Database size={12} /><span>Answer grounded in context</span></div></div></div>
}

const statusStyles: Record<ProjectStatus, string> = {
  Built: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  'In Progress': 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  Planned: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
}

function ProjectCard({ project, detailsHref }: { project: Project; detailsHref?: string }) {
  return (
    <article className={`project-card project-card--${project.accent} group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1`}>
      <div className={`project-art project-art--${project.visual} flex min-h-[15rem] shrink-0 flex-col justify-between gap-3 overflow-hidden border-b p-4 sm:min-h-[16rem] sm:p-5`}>
        <div className="flex min-w-0 items-start justify-between gap-3"><span className="min-w-0 font-mono text-[9px] tracking-[0.18em] text-white/70">PROJECT / {project.number}</span><span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] font-medium ${statusStyles[project.status]}`}>{project.status}</span></div>
        <div className="project-preview-stage min-h-44 flex-1"><ProjectPreview project={project} /></div>
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2"><span className="shrink-0 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider text-white/80">Illustrative preview</span><span className="min-w-0 flex-1 break-words text-right font-mono text-[8px] uppercase tracking-[.12em] text-white/55">{project.subtitle}</span></div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/55">{project.category}</p>
        <h3 className="mt-2 break-words font-display text-xl font-medium tracking-tight text-white">{project.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-200/80">{project.description}</p>
        <p className="mt-5 font-mono text-[8px] uppercase tracking-[.14em] text-slate-300/70">{project.technologyStatus === 'Used' ? 'Technology stack' : 'Planned technology direction'}</p>
        <TechnologyChips items={project.stack} label={project.technologyStatus === 'Used' ? 'Technologies used' : 'Planned technologies'} className="mt-2" />
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.12] pt-4"><span className="text-xs text-slate-100/85">{project.status === 'Planned' ? 'Concept in planning' : project.status === 'Built' ? 'Built project' : 'In development'}</span>{detailsHref ? <Link to={detailsHref} className="group/detail inline-flex items-center gap-1.5 text-xs font-medium text-cyan transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">Case study <ArrowUpRight size={14} className="transition-transform group-hover/detail:-translate-y-0.5 group-hover/detail:translate-x-0.5" /></Link> : <span aria-hidden="true" className="text-white/55 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan"><ArrowUpRight size={16} /></span>}</div>
      </div>
    </article>
  )
}

export default ProjectCard
