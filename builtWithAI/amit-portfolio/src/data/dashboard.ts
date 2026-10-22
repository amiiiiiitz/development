import { publicEndorsements } from './endorsements'
import { achievements } from './story'
import { publishedPublications } from './publications'
import projects from './projects'
import { calculateDashboardCounts } from './dashboardCounts'

const counts = calculateDashboardCounts({ projects, publications: publishedPublications, endorsements: publicEndorsements, achievements })

export const dashboardMetrics = [
  { label: 'Completed Projects', value: counts.completedProjects, href: '/projects' },
  { label: 'In Progress', value: counts.inProgress, href: '/projects' },
  { label: 'Published Papers', value: counts.publishedPapers, href: '/publications' },
  { label: 'Endorsements', value: counts.endorsements, href: '/endorsements' },
  { label: 'Certifications', value: counts.certifications, href: '/achievements' },
] as const
