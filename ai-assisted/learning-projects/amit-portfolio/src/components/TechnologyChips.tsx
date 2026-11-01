import cIcon from '../assets/c.svg'
import cppIcon from '../assets/cplusplus.svg'
import javascriptIcon from '../assets/javascript.svg'
import pythonIcon from '../assets/python.svg'
import reactIcon from '../assets/react.svg'

type TechnologyChipsProps = {
  items: string[]
  label: string
  className?: string
  showIcons?: boolean
}

const technologyIcons: Record<string, string> = {
  C: cIcon,
  'C++': cppIcon,
  Python: pythonIcon,
  JavaScript: javascriptIcon,
  'React.js': reactIcon,
}

function TechnologyChips({ items, label, className = '', showIcons = false }: TechnologyChipsProps) {
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => <li key={item} className="inline-flex min-h-7 items-center gap-2 border border-white/15 px-2.5 py-1 font-mono text-[10px] leading-4 text-white/65 transition-colors duration-150 hover:border-[var(--color-accent)]/55 hover:text-[var(--color-accent)] motion-reduce:transition-none">
        {showIcons && technologyIcons[item] && <img src={technologyIcons[item]} alt="" aria-hidden="true" className="h-4 w-4 shrink-0 object-contain" />}
        {item}
      </li>)}
    </ul>
  )
}

export default TechnologyChips