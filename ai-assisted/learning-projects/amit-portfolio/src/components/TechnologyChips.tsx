type TechnologyChipsProps = {
  items: string[]
  label: string
  className?: string
}

function TechnologyChips({ items, label, className = '' }: TechnologyChipsProps) {
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => <li key={item} className="inline-flex min-h-7 items-center border border-white/15 px-2.5 py-1 font-mono text-[10px] leading-4 text-white/65 transition-colors duration-150 hover:border-[var(--color-accent)]/55 hover:text-[var(--color-accent)] motion-reduce:transition-none">{item}</li>)}
    </ul>
  )
}

export default TechnologyChips