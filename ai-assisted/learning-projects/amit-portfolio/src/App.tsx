import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AchievementsPage from './pages/AchievementsPage'
import AboutPage from './pages/AboutPage'
import ResumePage from './pages/ResumePage'
import ContactPage from './pages/ContactPage'
import ExperiencePage from './pages/ExperiencePage'
import PublicationsPage from './pages/PublicationsPage'
import EndorsementsPage from './pages/EndorsementsPage'
import NotFoundPage from './pages/NotFoundPage'

function RouteScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      const targetId = decodeURIComponent(hash.slice(1))
      let attempts = 0
      let timeoutId: number | undefined
      const scrollWhenReady = () => {
        const target = document.getElementById(targetId)
        if (target) {
          target.scrollIntoView({ behavior, block: 'start' })
          return
        }
        if (attempts++ < 24) timeoutId = window.setTimeout(scrollWhenReady, 25)
      }
      timeoutId = window.setTimeout(scrollWhenReady, 0)
      return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId) }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return <motion.div key={location.pathname} initial={{ opacity: 1, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .14, ease: 'easeOut' }} className="min-h-screen"><Routes location={location}>
    <Route path="/" element={<HomePage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:slug" element={<ProjectDetailPage />} />
    <Route path="/experience" element={<ExperiencePage />} />
    <Route path="/publications" element={<PublicationsPage />} />
    <Route path="/endorsements" element={<EndorsementsPage />} />
    <Route path="/achievements" element={<AchievementsPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/resume" element={<ResumePage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></motion.div>
}
function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><RouteScrollManager /><AnimatedRoutes /></BrowserRouter></MotionConfig>
}
export default App
