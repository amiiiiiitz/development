import { ArrowUpRight } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import publications from '../data/publications'

function PublicationsPage() {
  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Publications</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Publications</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Scholarly records shown only when verified in data.</p>
      </section>
      <section className="section-wrap py-12 sm:py-16">
        {publications.length === 0 ? <div className="border border-white/10 p-8 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-white/40">No records</p>
          <p className="mt-4 text-base text-white/60">No published papers or verified research records are present.</p>
        </div> : <div className="divide-y divide-white/10 border border-white/10">
          {publications.map((item) => <article key={item.id} className="p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)]">{item.status.replaceAll('-', ' ')}</p>
              {item.verified && <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)]">Verified</span>}
            </div>
            <h2 className="mt-4 font-display text-2xl uppercase tracking-tight text-white">{item.title}</h2>
            {item.authors && <p className="mt-2 text-sm text-white/50">{item.authors.join(', ')}</p>}
            {(item.venue || item.date) && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{[item.venue, item.date].filter(Boolean).join(' / ')}</p>}
            {item.summary && <p className="mt-4 max-w-3xl text-base leading-8 text-white/65">{item.summary}</p>}
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-9 items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/70 transition hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">View record <ArrowUpRight size={14} /></a>}
          </article>)}
        </div>}
      </section>
    </main>
  </PageLayout>
}

export default PublicationsPage
