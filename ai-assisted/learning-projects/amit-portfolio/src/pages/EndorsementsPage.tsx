import PageLayout from '../components/PageLayout'
import { publicEndorsements } from '../data/endorsements'

function EndorsementsPage() {
  const publicItems = publicEndorsements

  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Endorsements</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Endorsements</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Manually maintained endorsements shown only when available.</p>
      </section>
      <section className="section-wrap py-12 sm:py-16">
        {publicItems.length === 0 ? <div className="border-y border-white/10 px-6 py-10 sm:px-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-white/40">No records</p>
          <p className="mt-4 max-w-xl font-display text-3xl uppercase leading-tight text-white">A genuine recommendation belongs here.</p>
          <p className="mt-3 text-base leading-7 text-white/55">No endorsements have been added yet.</p>
        </div> : <div className="grid gap-4 lg:grid-cols-2">
          {publicItems.map((item) => <article key={item.id} className="flex min-h-full flex-col border-t border-white/20 px-1 py-7 lg:px-4 lg:py-9">
            <blockquote className="flex-1">
              <span aria-hidden="true" className="font-display text-5xl leading-none text-[var(--color-accent)]/75">&ldquo;</span>
              <p className="max-w-2xl font-serif text-2xl leading-relaxed text-white/85 sm:text-3xl">{item.quote}</p>
            </blockquote>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-white">{item.name}</p>
              {(item.role || item.organization || item.relationship) && <p className="mt-1 text-sm text-white/50">{[item.role, item.organization, item.relationship].filter(Boolean).join(' · ')}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {item.date && <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">{item.date}</p>}
                {item.linkedinUrl && <a href={item.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Reference link<span className="sr-only"> (opens in a new tab)</span></a>}
              </div>
            </div>
          </article>)}
        </div>}
      </section>
    </main>
  </PageLayout>
}

export default EndorsementsPage
