export type PublicationStatus = 'published' | 'preprint' | 'submitted' | 'under-review' | 'in-progress'

export type Publication = {
  id: string
  title: string
  verified: boolean
  authors?: string[]
  status: PublicationStatus
  venue?: string
  date?: string
  summary?: string
  url?: string
}

/** Add only genuine scholarly records, with their current and verifiable status. */
const publications: Publication[] = []

export const verifiedPublications = publications.filter((publication) => publication.verified)
export const publishedPublications = verifiedPublications.filter((publication) => publication.status === 'published')
export default publications
