import { publicEndorsements } from './endorsements'
import { achievements } from './story'
import { publishedPublications } from './publications'
import projects, { featuredProjects } from './projects'
import { calculateDashboardCounts } from './dashboardCounts'

const counts = calculateDashboardCounts({ projects, featuredProjects, publications: publishedPublications, endorsements: publicEndorsements, achievements })

export const dashboardMetrics = [
  { label: 'Featured Projects', value: counts.featuredProjects, href: '/projects' },
  { label: 'In Progress', value: counts.inProgress, href: '/projects' },
  { label: 'Published Papers', value: counts.publishedPapers, href: '/publications' },
  { label: 'Endorsements', value: counts.endorsements, href: '/endorsements' },
  { label: 'Awards & Certificates', value: counts.awardsAndCertificates, href: '/achievements' },
] as const
