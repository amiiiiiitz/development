import { Moon, Sun } from 'lucide-react'

type ThemeToggleProps = {
  theme: 'dark' | 'light'
  onToggle: () => void
}

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return <button
    type="button"
    aria-label={`Switch to ${nextTheme} theme`}
    aria-pressed={theme === 'light'}
    title={`Switch to ${nextTheme} theme`}
    onClick={onToggle}
    className="ui-icon-button inline-grid shrink-0 place-items-center"
  >
    {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </button>
}

export default ThemeToggle
