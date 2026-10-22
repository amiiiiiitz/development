import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import PageLayout from '../components/PageLayout'
import { ProjectCaseStudy } from '../components/ProjectCaseStudy'
import projects from '../data/projects'

function ProjectDetailPage() {
  const { slug } = useParams()
  const project = projects.find((item) => item.slug === slug)
  if (!project) return <PageLayout><main className="section-wrap py-24"><h1 className="font-display text-4xl text-white">Project not found</h1><Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-sm text-cyan"><ArrowLeft size={15} /> All projects</Link></main></PageLayout>
  return <PageLayout><main className="section-wrap min-h-[70vh] py-12 sm:py-16">
    <Link to="/projects" className="inline-flex items-center gap-2 text-xs text-slate-200/65 transition hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><ArrowLeft size={14} /> All projects</Link>
    <header className="mb-8 mt-8 max-w-3xl"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">{project.category} / {project.status}</p><h1 className="mt-3 font-display text-4xl font-medium tracking-[-.045em] text-white sm:text-6xl">{project.title}</h1><p className="mt-4 text-sm leading-7 text-slate-200/70 sm:text-base">{project.description}</p></header>
    <ProjectCaseStudy project={project} defaultOpen />
    <p className="mt-5 font-mono text-[9px] leading-5 text-white/40">Interface compositions are illustrative previews where no genuine product screenshot is available.</p>
  </main></PageLayout>
}
export default ProjectDetailPage