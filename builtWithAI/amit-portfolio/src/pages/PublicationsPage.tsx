import { FileText } from 'lucide-react'
import { motion } from 'motion/react'
import PageLayout from '../components/PageLayout'
import TechnologyChips from '../components/TechnologyChips'
import { profile } from '../data/profile'
import { verifiedPublications as publications } from '../data/publications'

function safeResourceUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function PublicationsPage() {
  return <PageLayout><main className="section-wrap min-h-[72vh] py-14 sm:py-20">
    <header className="mb-10 max-w-3xl sm:mb-14">
      <p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Research / scholarly work</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-[-.05em] text-white sm:text-6xl">Publications</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/70">Research papers, preprints, and other scholarly work will be listed here with their publication details and source links.</p>
    </header>

    {publications.length ? <div className="space-y-3">{publications.map((publication, index) => <motion.article key={publication.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .32, delay: index * .04 }} className="border border-white/10 bg-white/[.02] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${publication.status === 'published' ? 'border-cyan/25 bg-cyan/[.06] text-cyan' : 'border-white/15 text-slate-200/60'}`}>{publication.status.replaceAll('-', ' ')}</span>{publication.date && <span className="font-mono text-[9px] text-white/45">{publication.date}</span>}</div>
      <h2 className="mt-4 font-display text-xl font-medium leading-snug text-white sm:text-2xl">{publication.title}</h2>
      {publication.authors?.length ? <p className="mt-2 text-xs leading-5 text-slate-200/65">{publication.authors.join(', ')}</p> : null}
      {publication.venue && <p className="mt-2 text-xs text-slate-200/55">{publication.venue}</p>}
      {publication.summary && <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200/65">{publication.summary}</p>}
      {safeResourceUrl(publication.url) && <a href={safeResourceUrl(publication.url)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-xs text-cyan hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">View record <FileText size={13} /></a>}
    </motion.article>)}</div> : <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} aria-labelledby="publications-empty-title" className="grid gap-7 border-y border-white/10 py-8 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6 sm:py-10">
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-cyan/20 bg-cyan/[.04] text-cyan/80"><FileText size={18} /></span>
      <div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-white/40">No records listed</p><h2 id="publications-empty-title" className="mt-2 font-display text-xl font-medium text-white sm:text-2xl">Publications and research papers will appear here as my research work develops.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/60">No papers, preprints, or scholarly documents are currently included in this portfolio.</p></div>
    </motion.section>}

    <section aria-labelledby="research-interests-title" className="grid gap-5 border-b border-white/10 py-8 sm:grid-cols-[.72fr_1.28fr] sm:gap-10 sm:py-10">
      <div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-violet-200/75">Learning direction</p><h2 id="research-interests-title" className="mt-2 font-display text-xl font-medium text-white">Research interests</h2></div>
      <div><p className="max-w-2xl text-sm leading-6 text-slate-200/60">These are areas I hope to study; they are not claims of completed research.</p><TechnologyChips items={profile.researchInterests} label="Research interests, not publications" className="mt-4" /></div>
    </section>
  </main></PageLayout>
}

export default PublicationsPage
