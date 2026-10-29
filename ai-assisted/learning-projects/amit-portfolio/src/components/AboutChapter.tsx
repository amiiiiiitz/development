import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { UserRound } from 'lucide-react'
import { profile } from '../data/profile'
import TechnologyChips from './TechnologyChips'

const background = [
  { label: 'Foundations', text: 'Programming in C and C++, with continued practice in data structures, algorithms, and problem-solving.' },
  { label: 'Exploration', text: 'Python, React and JavaScript frontend work, with exposure to backend development and APIs.' },
  { label: 'Current focus', text: `${profile.currentProgram}: ${profile.currentStudies.join(', ')}.` },
]

function AboutChapter() {
  const [portraitUnavailable, setPortraitUnavailable] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  return <section id="about" aria-labelledby="about-title" className="section-wrap py-10 sm:py-14">
    <section aria-labelledby="background-title" className="grid min-w-0 gap-10 border-t border-white/10 py-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-10 lg:py-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">01 / Profile</p>
        <h2 id="background-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Background</h2>
        <p className="mt-4 text-base leading-7 text-white/60">{profile.academicPosition}. Academic and self-directed work — no formal employment to date.</p>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
          whileInView={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [18, 0, -5, 0] }}
          viewport={{ once: true, amount: 0.25 }}
          transition={prefersReducedMotion ? { duration: 0 } : {
            opacity: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
            scale: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
            y: { duration: 1.8, times: [0, 0.4, 0.7, 1], ease: [0.25, 0.1, 0.25, 1] },
          }}
          className="relative mt-10 w-full max-w-sm"
        >
          <div className="flex min-h-64 items-center justify-center border border-white/10 p-2">
            {profile.portrait && !portraitUnavailable ? <img src={profile.portrait} alt={`Portrait of ${profile.name}`} onError={() => setPortraitUnavailable(true)} loading="lazy" decoding="async" className="block h-auto max-h-[34rem] w-auto max-w-full object-contain" /> : <div className="grid min-h-64 w-full place-items-center text-white/30"><UserRound size={28} /><span className="sr-only">Portrait unavailable</span></div>}
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-4">
            <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.34em] text-white/40">Portrait</span>
            <span className="min-w-0 break-words text-left font-mono text-[9px] uppercase leading-5 tracking-[0.34em] text-[var(--color-accent)] sm:text-right">{profile.direction}</span>
          </div>
        </motion.div>
      </div>
      <div className="min-w-0 space-y-0">
        {background.map((item, index) => <article key={item.label} className="grid gap-3 border-t border-white/10 py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">0{index + 1} / {item.label}</p>
          <p className="text-base leading-8 text-white/65">{item.text}</p>
        </article>)}
        <div className="border-t border-white/10 py-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Explored</p>
          <TechnologyChips items={profile.exploredTechnologies} label="Technologies explored" className="mt-4" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/30">Exploration, not mastery</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="direction-title" className="grid gap-10 border-t border-white/10 py-12 md:grid-cols-[minmax(18rem,.8fr)_1.2fr] md:gap-16 md:py-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">02 / Direction</p>
        <h2 id="direction-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Where I&apos;m headed</h2>
      </div>
      <div>
        <h3 className="font-display text-[clamp(2rem,4vw,3.4rem)] uppercase tracking-tight text-white">{profile.careerDirection}</h3>
        <p className="mt-6 text-base leading-8 text-white/65">Goal: build practical, reliable AI-powered applications. Focus on integrating models into useful software rather than training foundation models from scratch.</p>
        <p className="mt-4 text-base leading-8 text-white/60">Real applications require APIs, data handling, dependable logic, testing, security, and a usable interface.</p>
      </div>
    </section>

    <section aria-labelledby="building-title" className="grid gap-10 border-t border-white/10 py-12 md:grid-cols-[minmax(18rem,.8fr)_1.2fr] md:gap-16 md:py-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">03 / Applied AI</p>
        <h2 id="building-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Focus areas</h2>
      </div>
      <div>
        <p className="text-base leading-8 text-white/65">Interests and goals — not claims of production implementations.</p>
        <TechnologyChips items={profile.appliedAiFocus} label="Applied AI focus" className="mt-6" />
      </div>
    </section>

    <section aria-labelledby="learning-title" className="grid gap-10 border-t border-white/10 py-12 md:grid-cols-[minmax(18rem,.8fr)_1.2fr] md:gap-16 md:py-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">04 / Learning</p>
        <h2 id="learning-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Path</h2>
      </div>
      <div>
        <p className="text-base leading-8 text-white/65">Progressing through {profile.currentProgram.toLowerCase()}: {profile.currentStudies.join(', ')}. Next: {profile.nextLearning.slice(0, 6).join(', ')} and beyond.</p>
        <p className="mt-4 text-base leading-8 text-white/60">Learning by building small applications and testing behavior.</p>
      </div>
    </section>

    <section aria-labelledby="research-title" className="grid gap-10 border-t border-white/10 py-12 md:grid-cols-[minmax(18rem,.8fr)_1.2fr] md:gap-16 md:py-16">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">05 / Horizon</p>
        <h2 id="research-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Research interests</h2>
      </div>
      <div>
        <TechnologyChips items={profile.researchInterests} label="Research interests" className="mt-1" />
        <p className="mt-6 text-base leading-8 text-white/60">{profile.researchAmbition}</p>
      </div>
    </section>

    <section aria-labelledby="approach-title" className="border-y border-white/10 py-12 sm:py-16">
      <div className="grid gap-10 md:grid-cols-[minmax(18rem,.8fr)_1.2fr] md:gap-16">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">06 / Approach</p>
          <h2 id="approach-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">How I work</h2>
        </div>
        <div>
          <p className="text-base leading-8 text-white/65">Solve problems step by step, test ideas in small increments, and review for improvement.</p>
          <blockquote className="mt-10 border-l border-[var(--color-accent)] pl-6">
            <p className="font-display text-[clamp(2rem,4vw,3.2rem)] uppercase leading-[0.98] text-white">Hard work beats talent.<br /><span className="italic font-[var(--font-serif)] normal-case text-[var(--color-accent)]">Consistency beats both.</span></p>
          </blockquote>
        </div>
      </div>
    </section>
  </section>
}

export default AboutChapter
