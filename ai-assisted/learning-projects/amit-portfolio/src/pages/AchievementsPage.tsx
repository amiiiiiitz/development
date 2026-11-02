import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Award, BadgeCheck, Building2, CalendarDays, Expand, X } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { achievements as records, recognitionCategories, type AchievementCategory } from '../data/story'
import { getAchievementCategoryCounts, getAchievementSequence, getAdjacentAchievementId } from '../data/achievementSequence'

function SequenceControls({ onPrevious, onNext, disabled, inViewer = false }: { onPrevious: () => void; onNext: () => void; disabled: boolean; inViewer?: boolean }) {
  return <div className="mt-6 flex items-center justify-between">
    <button type="button" aria-label="Previous achievement" onClick={onPrevious} disabled={disabled} className="ui-button px-4 py-2 text-[11px] uppercase tracking-[0.16em]">
      <ArrowLeft size={14} /> Previous
    </button>
    <button type="button" aria-label="Next achievement" onClick={onNext} disabled={disabled} className="ui-button ui-button--accent px-4 py-2 text-[11px] uppercase tracking-[0.16em]">
      {inViewer ? 'Next' : 'Next'} <ArrowRight size={14} />
    </button>
  </div>
}

function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>(recognitionCategories[0].id)
  const [selectedId, setSelectedId] = useState<string | null>(() => getAchievementSequence(records, recognitionCategories)[0]?.id ?? null)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())
  const [viewerOpen, setViewerOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const sequence = getAchievementSequence(records, recognitionCategories)
  const categoryCounts = getAchievementCategoryCounts(records, recognitionCategories)
  const record = records.find((item) => item.id === selectedId) ?? null
  const hasImage = Boolean(record?.image && !failedImageIds.has(record.id))
  const markImageFailed = (id: string) => setFailedImageIds((current) => new Set(current).add(id))
  useEffect(() => {
    if (!viewerOpen) return
    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - root.clientWidth
    const preventBackgroundWheel = (event: WheelEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) event.preventDefault()
    }
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    document.addEventListener('wheel', preventBackgroundWheel, { capture: true, passive: false })
    return () => {
      document.removeEventListener('wheel', preventBackgroundWheel, true)
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
    }
  }, [viewerOpen])
  const chooseCategory = (category: AchievementCategory) => {
    const first = sequence.find((item) => item.category === category)
    setActiveCategory(category)
    setSelectedId(first?.id ?? null)
  }
  const move = (direction: -1 | 1) => {
    const nextId = getAdjacentAchievementId(records, recognitionCategories, selectedId, activeCategory, direction)
    const next = records.find((item) => item.id === nextId)
    if (next) { setSelectedId(next.id); setActiveCategory(next.category) }
  }
  const handleViewerKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (!viewerOpen) return
    if (event.key === 'Escape') {
      event.preventDefault()
      dialogRef.current?.close()
      return
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }

  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Recognition</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Achievements</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Verified academic and contest records. Categories remain visible even if empty.</p>
      </section>
      <section className="section-wrap py-10">
        <nav aria-label="Filter achievements by category" className="mb-8 flex flex-wrap gap-2">
          {recognitionCategories.map((category) => {
            const active = activeCategory === category.id
            return <button key={category.id} type="button" aria-pressed={active} onClick={() => chooseCategory(category.id)} className="ui-button ui-button--filter px-4 py-2 text-[11px] uppercase tracking-[0.16em]">
              <span>{category.id}</span>
              <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[9px]">{categoryCounts.get(category.id) ?? 0}</span>
            </button>
          })}
        </nav>

        {record ? <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_42%),#0b0b0b] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.07] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-accent)]">{record.category}</span>
              {record.credentialType && <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55">{record.credentialType}</span>}
            </div>
            {record.verified && <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-200/75"><BadgeCheck size={14} /> Verified</span>}
          </div>
          <AnimatePresence mode="wait">
            <motion.article key={record.id} initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: prefersReducedMotion ? 0 : 0.24 }} className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-4 sm:p-6 lg:border-r lg:border-white/[0.07]">
                <button ref={imageButtonRef} type="button" onClick={() => { dialogRef.current?.showModal(); setViewerOpen(true) }} aria-label={`Enlarge ${record.title}`} className="certificate-image-trigger group relative flex min-h-[18rem] w-full items-center justify-center overflow-hidden border border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_42%,rgba(217,181,76,0.09),transparent_62%),linear-gradient(145deg,#111,#080808)] p-4 sm:min-h-[25rem] sm:p-7">
                  {hasImage ? <img src={record.image} alt={record.imageAlt || record.title} className="max-h-[28rem] w-full object-contain drop-shadow-[0_16px_34px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-[1.015]" decoding="async" onError={() => markImageFailed(record.id)} /> : <div className="flex flex-col items-center gap-3 text-center text-white/40">
                    <Award size={24} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.32em]">{failedImageIds.has(record.id) ? 'Image unavailable' : 'No image supplied'}</span>
                  </div>}
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/65 backdrop-blur transition group-hover:border-[var(--color-accent)]/30 group-hover:text-white"><Expand size={13} /> View certificate</span>
                </button>
                <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">Select image to open full-size viewer</p>
              </div>
              <div className="flex flex-col justify-center border-t border-white/[0.07] p-5 sm:p-7 lg:border-t-0 lg:p-9">
                <div className="mb-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-accent)]/80"><Award size={14} /> Achievement record</div>
                <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] uppercase leading-[0.96] text-white">{record.title}</h2>
                {record.description && <p className="mt-5 border-l-2 border-[var(--color-accent)]/35 pl-4 text-sm leading-7 text-white/65 sm:text-base">{record.description}</p>}
                <dl className="mt-7 grid gap-2 sm:grid-cols-2">
                  {record.issuer && <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 sm:col-span-2"><dt className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.17em] text-white/40"><Building2 size={13} /> Issued by</dt><dd className="mt-2 text-sm leading-6 text-white/80">{record.issuer}</dd></div>}
                  {record.date && <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><dt className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.17em] text-white/40"><CalendarDays size={13} /> Date</dt><dd className="mt-2 text-sm text-white/80">{record.date}</dd></div>}
                  {record.result && <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><dt className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/40">Result</dt><dd className="mt-2 text-sm text-white/80">{record.result}</dd></div>}
                </dl>
                <SequenceControls onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} />
              </div>
            </motion.article>
          </AnimatePresence>
        </div> : <div className="rounded-2xl border border-white/[0.09] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent),#0b0b0b] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <Award className="mx-auto text-white/40" size={24} />
          <h2 className="mt-4 font-display text-2xl uppercase text-white">No verified records in {activeCategory}</h2>
          <p className="mt-2 text-base text-white/50">Category ready for a genuine record when available.</p>
          <div className="mx-auto max-w-sm"><SequenceControls onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} /></div>
        </div>}

        <dialog ref={dialogRef} aria-label={record ? `${record.title} certificate viewer` : 'Achievement certificate viewer'} className="certificate-dialog" onClose={() => { setViewerOpen(false); window.requestAnimationFrame(() => imageButtonRef.current?.focus()) }} onKeyDown={handleViewerKeyDown} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
          <button type="button" aria-label="Close certificate viewer" onClick={() => dialogRef.current?.close()} className="certificate-dialog-close"><X size={18} /></button>
          {record && <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/40">{record.category}</p>
            </div>
            <SequenceControls inViewer onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} />
            <div className="mt-8 flex items-center justify-center">
              {hasImage ? <img src={record.image} alt={record.imageAlt || record.title} onError={() => markImageFailed(record.id)} className="max-h-[70dvh] w-full object-contain" /> : <div className="grid min-h-64 place-items-center text-white/50">{failedImageIds.has(record.id) ? 'This certificate image is unavailable.' : 'No certificate image was supplied.'}</div>}
            </div>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="font-display text-xl uppercase text-white">{record.title}</p>
              {record.description && <p className="mt-3 text-base text-white/65">{record.description}</p>}
            </div>
          </div>}
        </dialog>
      </section>
    </main>
  </PageLayout>
}

export default AchievementsPage
