import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { profile } from '../data/profile'
import TechnologyChips from './TechnologyChips'

const background = [
  { label: 'Programming foundations', text: 'C and C++, with continued practice in data structures, algorithms, and problem-solving.' },
  { label: 'Software exploration', text: 'Python programming, React and JavaScript frontend work, and some exposure to backend development and APIs.' },
  { label: 'Current study', text: `${profile.currentProgram}: ${profile.currentStudies.join(', ')}.` },
]

function AboutChapter() {
  const [portraitUnavailable, setPortraitUnavailable] = useState(false)
  return <section id="about" aria-labelledby="about-title" className="section-wrap py-12 sm:py-16">
    <header className="mb-12 max-w-3xl sm:mb-16"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">About / direction and practice</p><h1 id="about-title" className="mt-3 font-display text-4xl font-medium leading-tight tracking-[-.05em] text-white sm:text-6xl">A practical path into AI engineering.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200/70">As a third-year CSE student at IUBAT, I started with programming and problem-solving, explored frontend work and backend APIs, and am now building my AI and machine-learning foundations.</p></header>

    <section aria-labelledby="background-title" className="grid gap-8 border-t border-white/10 py-10 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14 md:py-14">
      <div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-violet-200/75">01 / Starting point</p><h2 id="background-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">My background</h2><p className="mt-3 text-sm leading-6 text-slate-200/65">{profile.academicPosition}. My experience is academic and self-directed; it is not professional employment.</p>
        <motion.div initial={{ opacity: 0, x: -8, rotate: -4 }} whileInView={{ opacity: 1, x: 0, rotate: -2 }} viewport={{ once: true, amount: .25 }} whileHover={{ rotate: 0, y: -3 }} transition={{ duration: .35, ease: 'easeOut' }} className="relative isolate mx-auto mt-8 w-full max-w-[21rem] px-3 py-3 md:mx-0">
          <div className="relative aspect-[3/4] overflow-hidden border border-white/15 bg-[#101018] shadow-[0_24px_60px_rgba(0,0,0,.35)]">
            {profile.portrait && !portraitUnavailable ? <img src={profile.portrait} alt={`Portrait of ${profile.name}`} onError={() => setPortraitUnavailable(true)} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain object-center" /> : <div className="absolute inset-0 grid place-items-center text-white/40"><UserRound size={30} /><span className="sr-only">Portrait unavailable</span></div>}
            <span className="absolute bottom-3 left-3 border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.14em] text-white/75">{profile.direction}</span>
          </div><span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 translate-x-2 translate-y-2 border border-cyan/20" />
        </motion.div>
      </div>
      <div className="space-y-0">{background.map((item, index) => <article key={item.label} className="grid gap-2 border-t border-white/[.08] py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-slate-200/45">0{index + 1} / {item.label}</p><p className="text-sm leading-6 text-slate-100/75">{item.text}</p></article>)}<div className="pt-5"><h3 className="font-mono text-[9px] uppercase tracking-[.16em] text-white/45">Technologies I’ve explored</h3><TechnologyChips items={profile.exploredTechnologies} label="Technologies explored" className="mt-3" /><p className="mt-2 text-[10px] text-white/40">Exploration describes exposure, not mastery.</p></div></div>
    </section>

    <section aria-labelledby="direction-title" className="grid gap-6 border-t border-white/10 py-10 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14 md:py-14"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-cyan/80">02 / Career direction</p><h2 id="direction-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">Where I’m heading</h2></div><div><h3 className="font-display text-xl font-medium text-white">{profile.careerDirection}</h3><p className="mt-3 text-sm leading-7 text-slate-200/70">My goal is to build practical, reliable AI-powered applications. I’m more interested in applying AI capabilities within useful software than focusing primarily on training foundation models from scratch.</p><p className="mt-3 text-sm leading-7 text-slate-200/65">Real applications need more than model calls: APIs, data handling, dependable application logic, testing, security, and a usable interface all matter.</p></div></section>

    <section aria-labelledby="building-title" className="grid gap-6 border-t border-white/10 py-10 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14 md:py-14"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-violet-200/75">03 / Applications</p><h2 id="building-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">Building with AI</h2></div><div><p className="text-sm leading-7 text-slate-200/70">These are the kinds of systems I want to learn to design and build. They are interests and goals, not claims that each is already implemented.</p><TechnologyChips items={profile.appliedAiFocus} label="Applied AI interests and learning direction" className="mt-5" /></div></section>

    <section aria-labelledby="learning-title" className="grid gap-6 border-t border-white/10 py-10 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14 md:py-14"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-cyan/80">04 / Learning path</p><h2 id="learning-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">Foundations before shortcuts</h2></div><div><p className="text-sm leading-7 text-slate-200/70">I’m progressing through Python for AI, data analysis, and machine-learning fundamentals in an ongoing AI and Machine Learning Engineering program. Next, I plan to explore deep learning, NLP, LLM applications, RAG, agents, and deployment.</p><p className="mt-4 text-sm leading-7 text-slate-200/65">I learn by taking concepts into small applications and checking how they behave.</p></div></section>

    <section aria-labelledby="research-title" className="grid gap-6 border-t border-white/10 py-10 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14 md:py-14"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-violet-200/75">05 / Longer horizon</p><h2 id="research-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">Research interests</h2></div><div><TechnologyChips items={profile.researchInterests} label="Future AI research interests" className="mt-1" /><p className="mt-4 text-sm leading-7 text-slate-200/60">{profile.researchAmbition}</p></div></section>

    <section aria-labelledby="learning-approach-title" className="border-y border-white/10 py-10 sm:py-14"><div className="grid gap-6 md:grid-cols-[minmax(15rem,.8fr)_1.2fr] md:gap-14"><div><p className="font-mono text-[9px] uppercase tracking-[.17em] text-cyan/80">06 / Practice</p><h2 id="learning-approach-title" className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">How I learn</h2></div><div><p className="text-sm leading-7 text-slate-200/70">I practice by solving problems, testing ideas in small steps, and reviewing what needs to improve.</p><blockquote className="mt-7 border-l border-violet/50 pl-5 font-display text-xl font-medium leading-snug tracking-[-.025em] text-white sm:text-2xl"><span className="block">HARD WORK BEATS TALENT.</span><span className="mt-1 block text-violet-100/75">— CONSISTENCY BEATS BOTH.</span></blockquote><Link to="/contact" className="mt-7 inline-flex items-center gap-2 text-xs text-cyan transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">Connect or collaborate <ArrowUpRight size={14} /></Link></div></div></section>
  </section>
}
export default AboutChapter
