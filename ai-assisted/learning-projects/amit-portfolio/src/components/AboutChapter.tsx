import { profile } from '../data/profile'
import TechnologyChips from './TechnologyChips'

const background = [
  { label: 'Foundations', text: 'Programming in C and C++, with continued practice in data structures, algorithms, and problem-solving.' },
  { label: 'Exploration', text: 'Python, React and JavaScript frontend work, with exposure to backend development and APIs.' },
  { label: 'Current focus', text: `${profile.currentProgram}: ${profile.currentStudies.join(', ')}.` },
]

export function ProfileChapter() {
  return <section id="about-profile" aria-labelledby="background-title" className="min-w-0">
    <section aria-labelledby="background-title" className="grid min-w-0 gap-6 border-t border-white/10 pt-8 pb-8 lg:pt-0 lg:border-t-0">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-[var(--color-accent)]">01 / Profile</p>
        <h2 id="background-title" className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] uppercase tracking-tight text-white">Background</h2>
        <p className="mt-4 text-base leading-7 text-white/60">{profile.academicPosition}. Academic and self-directed work — no formal employment to date.</p>
      </div>
      <div className="min-w-0 space-y-0">
        {background.map((item, index) => <article key={item.label} className="grid gap-3 border-t border-white/10 py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">0{index + 1} / {item.label}</p>
          <p className="text-base leading-8 text-white/65">{item.text}</p>
        </article>)}
        <div className="border-t border-white/10 py-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Explored</p>
          <TechnologyChips items={profile.exploredTechnologies} label="Technologies explored" className="mt-4" showIcons />
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/30">Exploration, not mastery</p>
        </div>
      </div>
    </section>
  </section>
}

function AboutChapter() {
  return <div className="section-wrap pt-0 pb-10 sm:pb-14">

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
  </div>
}

export default AboutChapter
