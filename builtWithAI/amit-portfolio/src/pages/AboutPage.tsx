import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import PageLayout from '../components/PageLayout'
import AboutChapter from '../components/AboutChapter'
function AboutPage() { return <PageLayout><main className="min-h-[70vh] py-8"><AboutChapter /><div className="section-wrap pb-12"><Link to="/contact" className="inline-flex items-center gap-2 text-xs text-cyan hover:text-white">Contact me <ArrowUpRight size={14} /></Link></div></main></PageLayout> }
export default AboutPage