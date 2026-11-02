import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import projects from '../data/projects'
import { profile } from '../data/profile'
import terminalArtwork from '../assets/terminal.svg'

const featured = projects.filter((project) => project.status === 'Built')

function HomeChapters() {
  return <div className="section-wrap space-y-16 pb-16 sm:space-y-24 sm:pb-24">
    <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="grid overflow-hidden border border-white/10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative flex items-center justify-center border-b border-white/10 p-6 lg:border-b-0 lg:border-r sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,255,255,0.03),transparent_72%)]" />
        <div className="relative w-full max-w-md">
          <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">About</p>
          <h3 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.6rem)] uppercase leading-[0.94] text-white">{profile.name}</h3>
          <p className="mt-3 text-[11px] uppercase tracking-[0.36em] text-white/40">{profile.careerDirection}</p>
          <p className="mt-6 text-base leading-8 text-white/60">{profile.introduction}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-8 p-6 sm:p-8 lg:p-12">
        <img src={terminalArtwork} alt="Terminal" className="block h-auto w-full" />
        <Link to="/about" className="ui-button group px-6 py-3 text-[11px] uppercase tracking-[0.2em]">About <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
    </motion.article>
    <section id="projects-preview">
      <div className="mb-10 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">Selected Work</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] uppercase tracking-tight text-white">Projects</h2>
        </div>
        <Link to="/projects" className="ui-button px-4 py-2 text-[10px] uppercase tracking-[0.16em]">View archive <ArrowUpRight size={14} /></Link>
      </div>
      <div className="space-y-10">
      {featured.map((project) => <motion.article key={project.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="touch-feedback group grid overflow-hidden rounded-2xl border border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.035),transparent_42%),#0b0b0b] shadow-[0_24px_70px_rgba(0,0,0,0.25)] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative flex min-h-[22rem] flex-col justify-between p-6 sm:p-8 lg:min-h-[28rem] lg:p-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-black/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />Project {project.number} / Built</span>
          <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-accent)]">{project.category}</span>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">{project.subtitle}</p>
          <h3 className="mt-5 font-display text-[clamp(2.8rem,7vw,6.2rem)] uppercase leading-[0.92] tracking-tight text-white">{project.title}</h3>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/60">{project.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={`/projects/${project.slug}`} className="ui-button group px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Case Study <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
            {project.resources?.liveDemo && <a href={project.resources.liveDemo} target="_blank" rel="noopener noreferrer" className="ui-button px-5 py-3 text-[10px] uppercase tracking-[0.16em]">Live <ArrowUpRight size={14} /></a>}
            {project.resources?.sourceCode && <a href={project.resources.sourceCode} target="_blank" rel="noopener noreferrer" className="ui-button px-5 py-3 text-[10px] uppercase tracking-[0.16em]">Source <ArrowUpRight size={14} /></a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.stack.slice(0, 7).map((tech) => <span key={tech} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">{tech}</span>)}
        </div>
      </div>
      <div className="relative flex items-center justify-center overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_48%,rgba(217,181,76,0.1),transparent_65%),linear-gradient(160deg,rgba(255,255,255,0.025),transparent)] p-6 lg:border-l lg:border-t-0 sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 font-display text-[19rem] leading-none text-white/[0.025] transition-colors duration-500 group-hover:text-[var(--color-accent)]/[0.055]">{project.number}</div>
        <div className="relative w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#080808]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur sm:p-7">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Project overview</p>
            <span className="font-mono text-[9px] text-[var(--color-accent)]/65">0{project.number}</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.07] font-display text-xl text-[var(--color-accent)]">{project.title.slice(0, 1)}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{project.title}</p><p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">{project.subtitle}</p></div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em]"><span className="text-white/40">Build status</span><span className="text-emerald-200/75">Complete</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full w-full rounded-full bg-gradient-to-r from-[#9e8555] to-[#b39a69]" /></div>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-white/[0.07] pt-4">
            <span className="font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-white/35">Illustrative<br />project card</span>
            <span className="rounded-full border border-white/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55">{project.stack.length} technologies</span>
          </div>
        </div>
      </div>
    </motion.article>)}
      </div>
    </section>
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="border border-white/10 p-6 sm:p-10 lg:p-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--color-accent)]">Let&apos;s Build</p>
          <h3 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.94] text-white">Open to thoughtful collaboration</h3>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">Focused on practical AI applications, agent workflows, and reliable software.</p>
        </div>
        <Link to="/contact" className="ui-button ui-button--accent group shrink-0 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Let&apos;s Connect <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
    </motion.section>
  </div>
}

export default HomeChapters
