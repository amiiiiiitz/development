type TechnologyChipsProps = {
  items: string[]
  label: string
  className?: string
}

type Tone = 'cyan' | 'blue' | 'amber' | 'violet' | 'neutral'

function technologyTone(name: string): Tone {
  const technology = name.toLowerCase()
  if (technology.includes('react') || technology.includes('fastapi')) return 'cyan'
  if (technology === 'c' || technology.includes('c++') || technology.includes('python') || technology.includes('typescript') || technology.includes('vite')) return 'blue'
  if (technology.includes('javascript') || technology.includes('tailwind')) return 'amber'
  if (technology.includes('llm') || technology.includes('rag') || technology.includes('embedding') || technology.includes('motion')) return 'violet'
  return 'neutral'
}

const toneClasses: Record<Tone, string> = {
  cyan: 'border-cyan-300/25 bg-cyan-300/[.08] text-cyan-100 hover:border-cyan-200/45 hover:bg-cyan-300/[.13]',
  blue: 'border-sky-300/25 bg-sky-300/[.08] text-sky-100 hover:border-sky-200/45 hover:bg-sky-300/[.13]',
  amber: 'border-amber-300/25 bg-amber-300/[.07] text-amber-100 hover:border-amber-200/40 hover:bg-amber-300/[.12]',
  violet: 'border-violet-300/25 bg-violet-300/[.08] text-violet-100 hover:border-violet-200/45 hover:bg-violet-300/[.13]',
  neutral: 'border-slate-300/20 bg-slate-300/[.06] text-slate-100 hover:border-slate-200/35 hover:bg-slate-300/[.1]',
}

function TechnologyChips({ items, label, className = '' }: TechnologyChipsProps) {
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => <li key={item} className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 font-mono text-[10px] leading-4 transition-colors duration-150 motion-reduce:transition-none ${toneClasses[technologyTone(item)]}`}>{item}</li>)}
    </ul>
  )
}

export default TechnologyChips