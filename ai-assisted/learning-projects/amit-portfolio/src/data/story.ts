import contestCertificate from '../assets/first pro contest.jpeg'
import scholarsListCertificate from '../assets/optimized/scholarlist-certificate.webp'

export type AchievementCategory =
  | 'Academic Excellence'
  | 'Programming Contests'
  | 'Hackathons'
  | 'Education & Technical Certifications'

export type AchievementEntry = {
  id: string
  credentialKey?: string
  credentialType?: 'award' | 'participation' | 'certificate' | 'certification' | 'education'
  verified?: boolean
  title: string
  category: AchievementCategory
  issuer?: string
  date?: string
  description?: string
  image?: string
  imageAlt?: string
  credentialUrl?: string
  result?: string
  reflection?: string
}

export const recognitionCategories: { id: AchievementCategory; description: string }[] = [
  { id: 'Academic Excellence', description: 'Academic awards and distinctions.' },
  { id: 'Programming Contests', description: 'Contest participation and verified results.' },
  { id: 'Hackathons', description: 'Verified participation, roles, and outcomes.' },
  { id: 'Education & Technical Certifications', description: 'Verified education records and completed technical credentials.' },
]
// Details below are transcribed from the supplied certificate images.
export const achievements: AchievementEntry[] = [
  {
    id: 'scholars-list',
    credentialType: 'award',
    verified: true,
    title: "Scholar's List — Award for Academic Excellence",
    category: 'Academic Excellence',
    issuer: 'Department of Computer Science & Engineering, IUBAT',
    date: '21 April 2026',
    description: 'The certificate identifies the award period as Fall 2024.',
    image: scholarsListCertificate,
    imageAlt: "Photograph of Amit Hasan Simanto's Scholar's List award certificate for academic excellence, Fall 2024.",
  },
  {
    id: 'cse-battle-of-intellects-spring-2025',
    credentialType: 'certificate',
    verified: true,
    title: 'CSE Battle of Intellects Spring 2025 — Participant',
    category: 'Programming Contests',
    issuer: 'Department of CSE, IUBAT; organized by IUBAT IT Society',
    date: '7 May 2025',
    description: 'Participation certificate. The supplied certificate does not state a placement or contest result.',
    image: contestCertificate,
    imageAlt: 'Photograph of the CSE Battle of Intellects Spring 2025 participant certificate issued to Amit Hasan Simanto.',
  },
]
