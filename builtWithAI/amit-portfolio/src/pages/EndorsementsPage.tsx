import { ArrowUpRight, Quote, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import PageLayout from '../components/PageLayout'
import TechnologyChips from '../components/TechnologyChips'
import { publicEndorsements } from '../data/endorsements'

function safeLinkedInUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['linkedin.com', 'www.linkedin.com'].includes(url.hostname) ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function EndorsementsPage() {
  return <PageLayout><main className="section-wrap min-h-[72vh] py-14 sm:py-20">
    <header className="mb-10 max-w-3xl sm:mb-14"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Recommendations / shared with permission</p><h1 className="mt-3 font-display text-4xl font-medium tracking-[-.05em] text-white sm:text-6xl">Endorsements</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/70">Recommendations I have received and chosen to share. Each record is added manually after the original text and attribution are confirmed.</p></header>
    {publicEndorsements.length ? <div className="grid gap-4 md:grid-cols-2">{publicEndorsements.map((endorsement, index) => <motion.article key={endorsement.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .35, delay: index * .05 }} className="flex h-full flex-col border border-white/10 bg-white/[.02] p-6 sm:p-8">
      <Quote aria-hidden="true" size={20} className="text-violet-200/70" /><blockquote className="mt-5 flex-1 font-display text-base leading-7 text-white/90">“{endorsement.quote}”</blockquote>
      <footer className="mt-7 border-t border-white/10 pt-5"><p className="font-display text-sm font-medium text-white">{endorsement.name}</p>{(endorsement.role || endorsement.organization) && <p className="mt-1 text-xs text-slate-200/60">{[endorsement.role, endorsement.organization].filter(Boolean).join(' · ')}</p>}{(endorsement.relationship || endorsement.date) && <p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-white/40">{[endorsement.relationship, endorsement.date].filter(Boolean).join(' / ')}</p>}{endorsement.skills?.length ? <TechnologyChips items={endorsement.skills} label={`Endorsed skills for ${endorsement.name}`} className="mt-4" /> : null}{safeLinkedInUrl(endorsement.linkedinUrl) && <a href={safeLinkedInUrl(endorsement.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-[10px] text-cyan hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">LinkedIn profile <ArrowUpRight size={12} /></a>}</footer>
    </motion.article>)}</div> : <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="grid gap-5 border-y border-white/10 py-9 sm:grid-cols-[auto_1fr] sm:gap-6 sm:py-11"><span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-violet-200/20 bg-violet-200/[.04] text-violet-100/80"><UsersRound size={18} /></span><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-white/40">No public recommendations yet</p><h2 className="mt-2 font-display text-xl font-medium text-white sm:text-2xl">Recommendations will appear here as I add verified endorsements.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/60">This page is maintained manually. There is no public submission form.</p></div></motion.section>}
  </main></PageLayout>
}

export default EndorsementsPage
