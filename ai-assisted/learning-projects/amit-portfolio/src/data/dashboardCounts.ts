import { getUniqueEarnedAchievements } from './achievementSequence'

type ProjectRecord = { status: 'Built' | 'In Progress' | 'Planned' }
type PublicationRecord = { status: 'published' | 'preprint' | 'submitted' | 'under-review' | 'in-progress'; verified: boolean }
type EndorsementRecord = { id: string; quote: string; visible: boolean }
type AchievementRecord = { id: string; credentialKey?: string; credentialType?: 'award' | 'participation' | 'certificate' | 'certification' | 'education'; verified?: boolean }

export type DashboardCountInput = {
  projects: readonly ProjectRecord[]
  publications: readonly PublicationRecord[]
  endorsements: readonly EndorsementRecord[]
  achievements: readonly AchievementRecord[]
}

export function calculateDashboardCounts({ projects, publications, endorsements, achievements }: DashboardCountInput) {
  const visibleEndorsementIds = new Set<string>()
  const publicEndorsementCount = endorsements.filter((endorsement) => {
    if (!endorsement.visible || !endorsement.quote.trim() || visibleEndorsementIds.has(endorsement.id)) return false
    visibleEndorsementIds.add(endorsement.id)
    return true
  }).length

  const certificateCount = getUniqueEarnedAchievements(achievements).length

  return {
    completedProjects: projects.filter((project) => project.status === 'Built').length,
    inProgress: projects.filter((project) => project.status === 'In Progress').length,
    publishedPapers: publications.filter((publication) => publication.verified && publication.status === 'published').length,
    endorsements: publicEndorsementCount,
    certifications: certificateCount,
  }
}
