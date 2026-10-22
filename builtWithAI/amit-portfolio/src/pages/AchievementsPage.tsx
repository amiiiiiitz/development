import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Award, X } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { achievements as records, recognitionCategories, type AchievementCategory } from '../data/story'
import { getAchievementCategoryCounts, getAchievementSequence, getAdjacentAchievementId } from '../data/achievementSequence'

function SequenceControls({ onPrevious, onNext, disabled, inViewer = false }: { onPrevious: () => void; onNext: () => void; disabled: boolean; inViewer?: boolean }) {
  const buttonBase = 'inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-xs transition active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15'
  return <div className="mt-5 flex items-center justify-between">
    <button type="button" aria-label="Previous achievement" onClick={onPrevious} disabled={disabled} className={`${buttonBase} border-white/15 text-white/75 hover:border-violet/50 hover:text-white`}><ArrowLeft size={14} /> Previous</button>
    <button type="button" aria-label="Next achievement" onClick={onNext} disabled={disabled} className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-cyan/30 bg-cyan/[.06] py-1 pl-4 pr-1 text-xs text-cyan transition active:scale-[.98] hover:border-cyan/60 hover:bg-cyan/[.11] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-cyan/30 disabled:hover:bg-cyan/[.06]">
      <span>{inViewer ? 'Next' : 'Next achievement'}</span><span className="grid size-10 place-items-center rounded-full bg-cyan text-ink transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0"><ArrowRight size={16} /></span>
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
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }

  return <PageLayout><main className="section-wrap min-h-[72vh] py-14 sm:py-20">
    <header className="mb-9 max-w-3xl sm:mb-12"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Evidence / recognition</p><h1 className="mt-3 font-display text-4xl font-medium tracking-[-.05em] text-white sm:text-6xl">Achievements</h1><p className="mt-4 text-sm leading-7 text-slate-200/65">A focused view of verified academic and contest records. Categories remain visible even when there are no records to show.</p></header>

    <nav aria-label="Filter achievements by category" className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-5">{recognitionCategories.map((category) => {
      const active = activeCategory === category.id
      return <button key={category.id} type="button" aria-pressed={active} onClick={() => chooseCategory(category.id)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] transition active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${active ? 'border-cyan/40 bg-cyan/[.08] text-cyan' : 'border-white/10 text-slate-200/60 hover:border-white/25 hover:text-white'}`}><span>{category.id}</span><span aria-hidden="true" className="font-mono text-[9px] tabular-nums text-current opacity-60">{categoryCounts.get(category.id) ?? 0}</span></button>
    })}</nav>

    {record ? <div className="mx-auto max-w-5xl">
      <div className="mb-4 border-b border-white/10 pb-3"><span aria-live="polite" className="font-mono text-[9px] uppercase tracking-[.15em] text-amber-200/75">{record.category}</span></div>
      <AnimatePresence mode="wait"><motion.article key={record.id} initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: prefersReducedMotion ? 0 : .22 }} className="grid overflow-hidden border border-white/10 sm:grid-cols-[1.1fr_.9fr]">
        <div className="flex min-h-64 items-center justify-center border-b border-white/10 bg-white/[.02] p-4 sm:min-h-[25rem] sm:border-b-0 sm:border-r sm:p-7"><button ref={imageButtonRef} type="button" onClick={() => { dialogRef.current?.showModal(); setViewerOpen(true) }} aria-label={`Enlarge ${record.title}`} className="group flex h-full w-full flex-col items-center justify-center cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">{hasImage ? <img src={record.image} alt={record.imageAlt || record.title} className="mx-auto max-h-[25rem] w-full object-contain" decoding="async" onError={() => markImageFailed(record.id)} /> : <span role="status" className="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-white/45"><Award size={24} /><span className="font-mono text-[9px] uppercase tracking-wider">{failedImageIds.has(record.id) ? 'Image unavailable' : 'No image supplied'}</span><span className="text-xs">Open details</span></span>}<span className="mt-3 block w-full text-left text-[10px] text-white/45 transition group-hover:text-cyan">{hasImage ? 'Select image to enlarge' : 'Open certificate viewer'}</span></button></div>
        <div className="flex flex-col justify-center p-6 sm:p-9"><p className="font-mono text-[9px] uppercase tracking-[.17em] text-white/45">{record.category}</p><h2 className="mt-3 font-display text-2xl font-medium leading-tight text-white sm:text-3xl">{record.title}</h2>{record.description && <p className="mt-4 text-sm leading-7 text-slate-200/70">{record.description}</p>}<dl className="mt-6 space-y-4 border-t border-white/10 pt-5 text-xs">{record.issuer && <div><dt className="text-white/40">Issuer / organizer</dt><dd className="mt-1 text-white/75">{record.issuer}</dd></div>}{record.date && <div><dt className="text-white/40">Date</dt><dd className="mt-1 text-white/75">{record.date}</dd></div>}{record.result && <div><dt className="text-white/40">Result</dt><dd className="mt-1 text-white/75">{record.result}</dd></div>}</dl></div>
      </motion.article></AnimatePresence>
      <SequenceControls onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} />
    </div> : <div className="mx-auto max-w-5xl border-y border-dashed border-white/15 py-14 text-center"><Award className="mx-auto text-violet-200/60" size={24} /><h2 className="mt-4 font-display text-xl font-medium text-white">No verified records in {activeCategory} yet.</h2><p className="mt-2 text-sm text-slate-200/55">This category is ready for a genuine record when one is available.</p><div className="mx-auto max-w-sm"><SequenceControls onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} /></div></div>}

    <dialog ref={dialogRef} aria-label={record ? `${record.title} certificate viewer` : 'Achievement certificate viewer'} className="certificate-dialog" onClose={() => { setViewerOpen(false); window.requestAnimationFrame(() => imageButtonRef.current?.focus()) }} onKeyDown={handleViewerKeyDown} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
      <button type="button" aria-label="Close certificate viewer" onClick={() => dialogRef.current?.close()} className="certificate-dialog-close"><X size={18} /></button>
      {record && <>
        <div className="mb-3 pr-12 font-mono text-[10px] uppercase tracking-[.15em] text-cyan">{record.category}</div>
        <SequenceControls inViewer onPrevious={() => move(-1)} onNext={() => move(1)} disabled={sequence.length === 0} />
        {hasImage ? <img src={record.image} alt={record.imageAlt || record.title} onError={() => markImageFailed(record.id)} /> : <div role="status" className="grid min-h-64 place-items-center text-sm text-white/55">{failedImageIds.has(record.id) ? 'This certificate image is unavailable.' : 'No certificate image was supplied.'}</div>}
        <p>{record.title}</p>
        {record.description && <p className="text-sm leading-6 text-white/65">{record.description}</p>}
        <dl className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">{record.issuer && <div><dt className="text-white/40">Issuer / organizer</dt><dd className="mt-1 text-white/75">{record.issuer}</dd></div>}{record.date && <div><dt className="text-white/40">Date</dt><dd className="mt-1 text-white/75">{record.date}</dd></div>}{record.result && <div><dt className="text-white/40">Result</dt><dd className="mt-1 text-white/75">{record.result}</dd></div>}</dl>
      </>}
    </dialog>
  </main></PageLayout>
}
export default AchievementsPage
