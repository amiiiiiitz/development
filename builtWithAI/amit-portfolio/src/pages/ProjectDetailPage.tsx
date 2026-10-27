import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import PageLayout from '../components/PageLayout'
import { ProjectCaseStudy } from '../components/ProjectCaseStudy'
import projects from '../data/projects'

function ProjectDetailPage() {
  const { slug } = useParams()
  const project = projects.find((item) => item.slug === slug)
  if (!project) return <PageLayout><main className="section-wrap py-24"><h1 className="font-display text-4xl text-white">Project not found</h1><Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-accent)]"><ArrowLeft size={15} /> All projects</Link></main></PageLayout>
  return <PageLayout><main className="section-wrap min-h-[70vh] py-12 sm:py-16">
    <Link to="/projects" className="inline-flex items-center gap-2 text-xs text-white/65 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><ArrowLeft size={14} /> All projects</Link>
    <header className="mb-8 mt-8 max-w-3xl"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--color-accent)]">{project.category} / {project.status}</p><h1 className="mt-3 font-display text-[clamp(2.8rem,8vw,6rem)] uppercase leading-[0.92] tracking-[-.045em] text-white">{project.title}</h1><p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">{project.description}</p></header>
    <ProjectCaseStudy project={project} defaultOpen />
    <p className="mt-5 font-mono text-[9px] leading-5 text-white/40">Interface compositions are illustrative previews where no genuine product screenshot is available.</p>
  </main></PageLayout>
}
export default ProjectDetailPage