import { motion } from 'motion/react'
import { ArrowDown, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import ProjectCard from '../components/ProjectCard'
import projects, { projectCategories } from '../data/projects'

const reveal = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: .45, ease: 'easeOut' as const } } }

function ProjectsPage() {
  const builtCount = projects.filter((project) => project.status === 'Built').length
  const inProgressCount = projects.filter((project) => project.status === 'In Progress').length
  const plannedCount = projects.filter((project) => project.status === 'Planned').length
  return <PageLayout><main className="relative min-h-[70vh] overflow-x-clip">
    <section aria-labelledby="projects-title" className="projects-hero relative mx-auto w-full max-w-7xl px-6 pb-14 pt-16 sm:px-10 sm:pb-20 sm:pt-24 lg:px-16">
      <p className="mb-5 font-mono text-[9px] uppercase tracking-[.22em] text-cyan">Project notebook / status-led work</p>
      <h1 id="projects-title" className="max-w-4xl font-display text-[clamp(2.8rem,7vw,5.8rem)] font-medium leading-[1.02] tracking-[-.06em] text-white">Ideas, decisions, <span className="hero-gradient">engineering in progress.</span></h1>
      <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">A growing record of what exists, what is planned, and what still needs to be learned. Each story separates evidence from intention.</p>
      <div className="mt-8 flex flex-wrap items-center gap-3"><a href="#project-categories" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-ink transition hover:bg-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">Browse projects <ArrowDown size={14} /></a><Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs text-white/75 transition hover:border-violet/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"><ArrowLeft size={14} /> Back home</Link></div>
      <p className="mt-12 flex flex-wrap gap-x-3 gap-y-2 border-t border-white/[.08] pt-5 font-mono text-[9px] uppercase tracking-[.14em] text-white/50"><span>{String(projects.length).padStart(2, '0')} projects</span><span aria-hidden="true" className="text-white/25">/</span><span>{builtCount} built</span><span aria-hidden="true" className="text-white/25">/</span><span>{inProgressCount} in progress</span><span aria-hidden="true" className="text-white/25">/</span><span>{plannedCount} planned</span></p>
    </section>
    <div id="project-categories" className="border-y border-white/[.07]"><div className="section-wrap space-y-14 py-14 sm:space-y-20 sm:py-20">
      {projectCategories.map((category, categoryIndex) => { const entries = projects.filter((project) => project.category === category); return <section key={category} aria-labelledby={`category-${categoryIndex}`} className={categoryIndex ? 'border-t border-white/[.1] pt-12 sm:pt-16' : ''}>
        <div className="mb-7 max-w-2xl"><p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-cyan">0{categoryIndex + 1} / Category</p><h2 id={`category-${categoryIndex}`} className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">{category}</h2><p className="mt-3 text-sm leading-6 text-white/60">{category === 'Built with AI Tools' ? 'Projects shaped through AI-assisted development, with decisions and verification recorded as they happen.' : 'Concepts for learning through personal implementation of core logic, retrieval, data handling, and system behavior.'}</p></div>
        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: .1 } } }} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .08 }} className="grid auto-rows-fr gap-4 lg:grid-cols-2">{entries.map((project) => <motion.div key={project.slug} variants={reveal} className="h-full min-w-0"><ProjectCard project={project} detailsHref={`/projects/${project.slug}`} /></motion.div>)}</motion.div>
      </section> })}
    </div></div>
  </main></PageLayout>
}
export default ProjectsPage
