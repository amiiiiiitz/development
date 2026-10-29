export type Endorsement = {
  id: string
  name: string
  role?: string
  organization?: string
  relationship?: string
  quote: string
  skills?: string[]
  linkedinUrl?: string
  date?: string
  visible: boolean
}

/** Add, edit, hide (visible: false), or remove records here. Never add sample quotes. */
const endorsements: Endorsement[] = []

const ids = new Set<string>()
export const publicEndorsements = endorsements.filter((endorsement) => {
  if (!endorsement.visible || !endorsement.quote.trim() || ids.has(endorsement.id)) return false
  ids.add(endorsement.id)
  return true
})

export default endorsements
