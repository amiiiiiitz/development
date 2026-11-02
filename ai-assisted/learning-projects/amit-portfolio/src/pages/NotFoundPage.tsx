import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import PageLayout from '../components/PageLayout'
function NotFoundPage() { return <PageLayout><main className="section-wrap flex min-h-[65vh] flex-col items-start justify-center py-20"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--color-accent)]">404 / Page not found</p><h1 className="mt-4 font-display text-5xl font-medium tracking-tight text-white">This page isn’t here.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/60">The address may have changed, or the page may not exist.</p><Link to="/" className="ui-button mt-7 min-h-11 px-4 py-3 text-xs"><ArrowLeft size={14} /> Back home</Link></main></PageLayout> }
export default NotFoundPage