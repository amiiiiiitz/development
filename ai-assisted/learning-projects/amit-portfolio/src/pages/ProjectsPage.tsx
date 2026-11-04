import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import ProjectCard from '../components/ProjectCard'
import { featuredProjects, projectCategories, projectCategoryLabels, publishedProjects } from '../data/projects'

const reveal = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } } }

function ProjectsPage() {
  const aiAssistedCount = featuredProjects.filter((project) => project.category === 'ai-assisted').length
  const builtFromScratchCount = featuredProjects.filter((project) => project.category === 'built-from-scratch').length
  return <PageLayout>
    <main className="relative min-h-[70vh] overflow-x-clip">
      <section aria-labelledby="projects-title" className="section-wrap pt-12 pb-10 sm:pt-16 sm:pb-14">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Archive</p>
        <h1 id="projects-title" className="mt-4 font-display text-[clamp(3.2rem,8vw,6.5rem)] uppercase leading-[0.92] tracking-tight text-white">Projects</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">A curated selection of featured projects built with AI tools and from scratch.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#project-categories" className="ui-button ui-button--accent group px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Browse <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          <Link to="/" className="ui-button px-6 py-3 text-[11px] uppercase tracking-[0.2em]"><ArrowLeft size={14} /> Home</Link>
        </div>
        <p className="mt-10 flex flex-wrap gap-x-3 gap-y-2 border-t border-white/10 pt-6 font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">
          <span>{String(featuredProjects.length).padStart(2, '0')} featured</span>
          <span aria-hidden="true">/</span>
          <span>{aiAssistedCount} {projectCategoryLabels['ai-assisted']}</span>
          <span aria-hidden="true">/</span>
          <span>{builtFromScratchCount} built from scratch</span>
        </p>
      </section>
      <div id="project-categories" className="border-t border-white/10">
        <div className="section-wrap space-y-16 py-12 sm:space-y-20 sm:py-16">
          {projectCategories.map((category, categoryIndex) => {
            const entries = publishedProjects.filter((project) => project.category === category)
            return <section key={category} aria-labelledby={`category-${categoryIndex}`} className={categoryIndex ? 'border-t border-white/10 pt-12 sm:pt-16' : ''}>
              <div className="mb-10 max-w-2xl">
                <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">0{categoryIndex + 1} / {projectCategoryLabels[category]}</p>
                <h3 id={`category-${categoryIndex}`} className="mt-4 font-display text-[clamp(2.4rem,6vw,4.6rem)] uppercase tracking-tight text-white">{projectCategoryLabels[category]}</h3>
                <p className="mt-4 text-base leading-8 text-white/60">{category === 'ai-assisted' ? 'Projects shaped with AI assistance, with decisions and verification noted as they happen.' : 'Projects independently developed from scratch.'}</p>
              </div>
              <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }} className="grid auto-rows-fr gap-4 lg:grid-cols-2">
                {entries.map((project) => <motion.div key={project.slug} variants={reveal} className="h-full min-w-0"><ProjectCard project={project} detailsHref={`/projects/${project.slug}`} /></motion.div>)}
              </motion.div>
            </section>
          })}
        </div>
      </div>
    </main>
  </PageLayout>
}

export default ProjectsPage
