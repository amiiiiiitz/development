import { ArrowRight, ArrowUpRight, Award, Compass } from 'lucide-react'
import { Link } from 'react-router'
import projects from '../data/projects'
import { achievements } from '../data/story'
import ProjectCard from './ProjectCard'

function HomeChapters() {
  const selectedProjects = projects.slice(0, 2)
  const selectedAchievement = achievements.find((item) => item.image)
  return <>

    <section id="projects" aria-labelledby="home-projects-title" className="section-wrap py-16 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl"><p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Selected work / concepts</p><h2 id="home-projects-title" className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">Work in progress...</h2><p className="mt-3 text-sm leading-6 text-slate-200/65">A few selected projects from the portfolio and current learning direction.</p></div><Link to="/projects" className="inline-flex items-center gap-2 text-xs text-cyan transition hover:text-white">All projects <ArrowRight size={14} /></Link></div>
      <div className="grid gap-4 lg:grid-cols-2">{selectedProjects.map((project) => <ProjectCard key={project.slug} project={project} detailsHref={`/projects/${project.slug}`} />)}</div>
    </section>
    <section aria-labelledby="home-achievements-title" className="border-y border-white/[.07] py-14 sm:py-16"><div className="section-wrap grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="grid h-12 w-12 place-items-center rounded-xl border border-amber-300/20 text-amber-200"><Award size={20} /></div><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-amber-200/75">Verified recognition</p><h2 id="home-achievements-title" className="mt-2 font-display text-xl font-medium text-white">{selectedAchievement?.title ?? 'Achievements and certificates'}</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-200/65">{selectedAchievement?.description ?? 'See the achievement gallery for verified records.'}</p></div><Link to="/achievements" className="inline-flex items-center gap-2 text-xs text-cyan transition hover:text-white">Achievement gallery <ArrowUpRight size={14} /></Link></div></section>
    <section aria-labelledby="home-about-title" className="section-wrap grid gap-6 py-16 sm:grid-cols-[1fr_auto] sm:items-end sm:py-20"><div className="max-w-2xl"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-violet-200/75">A little about me</p><h2 id="home-about-title" className="mt-3 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">Curiosity shapes the work I want to do.</h2></div><Link to="/about" className="inline-flex items-center gap-2 text-xs text-cyan transition hover:text-white">Read my background <Compass size={14} /></Link></section>
    <section className="section-wrap pb-20 sm:pb-24"><div className="contact-panel flex flex-col gap-5 rounded-2xl border border-white/10 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-9"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Continue the conversation</p><h2 className="mt-2 font-display text-2xl font-medium text-white">Have a thoughtful problem in mind?</h2></div><Link to="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-ink transition hover:bg-cyan">Get in touch <ArrowUpRight size={14} /></Link></div></section>
  </>
}
export default HomeChapters
