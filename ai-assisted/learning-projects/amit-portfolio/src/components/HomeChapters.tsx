import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import projects from '../data/projects'
import { profile } from '../data/profile'

const featured = projects.filter((project) => project.status === 'Built')

function HomeChapters() {
  return <div className="space-y-10">
    {featured.map((project) => <motion.article key={project.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="grid overflow-hidden border border-white/10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative flex min-h-[22rem] flex-col justify-between p-6 sm:p-8 lg:min-h-[28rem] lg:p-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/40">Project {project.number}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-[var(--color-accent)]">{project.category}</span>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">{project.subtitle}</p>
          <h3 className="mt-5 font-display text-[clamp(2.8rem,7vw,6.2rem)] uppercase leading-[0.92] tracking-tight text-white">{project.title}</h3>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/60">{project.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={`/projects/${project.slug}`} className="group inline-flex items-center gap-3 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">Case Study <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
            {project.resources?.liveDemo && <a href={project.resources.liveDemo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white/70 transition hover:border-white hover:text-white">Live <ArrowUpRight size={14} /></a>}
            {project.resources?.sourceCode && <a href={project.resources.sourceCode} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white/70 transition hover:border-white hover:text-white">Source <ArrowUpRight size={14} /></a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.stack.slice(0, 7).map((tech) => <span key={tech} className="border border-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">{tech}</span>)}
        </div>
      </div>
      <div className="relative flex items-center justify-center border-t border-white/10 p-6 lg:border-l lg:border-t-0 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(217,181,76,0.09),transparent_72%)]" />
        <div className="relative w-full max-w-md border border-white/10 p-8 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-white/30">Editorial Approach</p>
          <p className="mt-6 font-display text-[clamp(2rem,4vw,3.8rem)] uppercase leading-[0.95] text-white">Evidence <span className="italic font-[var(--font-serif)] normal-case">over</span> Claims</p>
          <p className="mt-4 text-sm leading-7 text-white/55">Clear separation between built work, in-progress work, and planned concepts.</p>
        </div>
      </div>
    </motion.article>)}
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
      <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">Interests</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.appliedAiFocus.slice(0, 8).map((item) => <span key={item} className="border border-white/10 px-3 py-1 text-sm text-white/60">{item}</span>)}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/about" className="group inline-flex items-center gap-3 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">About <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
          <Link to="/contact" className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-white/70 transition hover:border-white hover:text-white">Contact <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </motion.article>
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="border border-white/10 p-6 sm:p-10 lg:p-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--color-accent)]">Let&apos;s Build</p>
          <h3 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.94] text-white">Open to thoughtful collaboration</h3>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">Focused on practical AI applications, agent workflows, and reliable software.</p>
        </div>
        <Link to="/contact" className="group inline-flex items-center gap-3 border border-[var(--color-accent)] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-black">Get in Touch <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
    </motion.section>
  </div>
}

export default HomeChapters
