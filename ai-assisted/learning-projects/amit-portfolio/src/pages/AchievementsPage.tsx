import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Award, X } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { achievements as records, recognitionCategories, type AchievementCategory } from '../data/story'
import { getAchievementCategoryCounts, getAchievementSequence, getAdjacentAchievementId } from '../data/achievementSequence'

function SequenceControls({ onPrevious, onNext, disabled, inViewer = false }: { onPrevious: () => void; onNext: () => void; disabled: boolean; inViewer?: boolean }) {
  return <div className="mt-6 flex items-center justify-between">
    <button type="button" aria-label="Previous achievement" onClick={onPrevious} disabled={disabled} className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white/60 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
      <ArrowLeft size={14} /> Previous
    </button>
    <button type="button" aria-label="Next achievement" onClick={onNext} disabled={disabled} className="inline-flex items-center gap-2 border border-[var(--color-accent)] px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-accent)]">
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
            return <button key={category.id} type="button" aria-pressed={active} onClick={() => chooseCategory(category.id)} className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.3em] transition ${active ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-white/15 text-white/60 hover:border-white hover:text-white'}`}>
              <span>{category.id}</span>
              <span className="font-mono text-[9px]">{categoryCounts.get(category.id) ?? 0}</span>
            </button>
          })}
        </nav>

        {record ? <div className="border border-white/10">
          <div className="border-b border-white/10 p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/40">{record.category}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.article key={record.id} initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: prefersReducedMotion ? 0 : 0.24 }} className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex items-center justify-center border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                <button ref={imageButtonRef} type="button" onClick={() => { dialogRef.current?.showModal(); setViewerOpen(true) }} aria-label={`Enlarge ${record.title}`} className="group flex w-full flex-col items-center justify-center">
                  {hasImage ? <img src={record.image} alt={record.imageAlt || record.title} className="max-h-[28rem] w-full object-contain" decoding="async" onError={() => markImageFailed(record.id)} /> : <div className="flex flex-col items-center gap-3 text-center text-white/40">
                    <Award size={24} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.32em]">{failedImageIds.has(record.id) ? 'Image unavailable' : 'No image supplied'}</span>
                    <span className="text-sm">Open viewer</span>
                  </div>}
                </button>
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-10">
                <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] uppercase leading-[0.96] text-white">{record.title}</h2>
                {record.description && <p className="mt-4 text-base leading-8 text-white/65">{record.description}</p>}
                <dl className="mt-8 space-y-4 border-t border-white/10 pt-6">
                  {record.issuer && <div><dt className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Issuer</dt><dd className="mt-2 text-white/80">{record.issuer}</dd></div>}
                  {record.date && <div><dt className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Date</dt><dd className="mt-2 text-white/80">{record.date}</dd></div>}
                  {record.result && <div><dt className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Result</dt><dd className="mt-2 text-white/80">{record.result}</dd></div>}
                </dl>
                <SequenceControls onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} />
              </div>
            </motion.article>
          </AnimatePresence>
        </div> : <div className="border border-white/10 p-8 text-center">
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
