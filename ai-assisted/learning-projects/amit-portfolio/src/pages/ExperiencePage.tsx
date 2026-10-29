import PageLayout from '../components/PageLayout'
import { experience } from '../data/profile'

function ExperiencePage() {
  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Experience</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Experience</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Verified activities and experience from the portfolio.</p>
      </section>
      <section className="section-wrap py-12 sm:py-16">
        {experience.length === 0 ? <div className="grid gap-6 border-y border-white/10 py-9 sm:grid-cols-[12rem_1fr] sm:gap-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-white/40">No records</p>
          <div>
            <h2 className="font-display text-3xl uppercase leading-tight text-white">A career still taking shape.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">No formal employment records are present. Academic and self-directed work is kept separate from professional experience.</p>
          </div>
        </div> : <div className="divide-y divide-white/10 border border-white/10">
          {experience.map((item, index) => <article key={`${item.organization}-${item.role}-${item.dates ?? index}`} className="relative grid gap-4 p-6 sm:grid-cols-[12rem_1fr] sm:gap-8 lg:p-8">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">{item.dates || '\u2014'}</p>
            </div>
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-accent)]">0{index + 1} / Verified activity</p>
              <h2 className="font-display text-2xl uppercase tracking-tight text-white">{item.role}</h2>
              <p className="mt-2 text-sm uppercase tracking-[0.28em] text-white/40">{item.organization}</p>
              {item.description && <p className="mt-4 text-base leading-8 text-white/65">{item.description}</p>}
            </div>
          </article>)}
        </div>}
      </section>
    </main>
  </PageLayout>
}

export default ExperiencePage
