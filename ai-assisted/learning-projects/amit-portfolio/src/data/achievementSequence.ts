import type { AchievementCategory, AchievementEntry, recognitionCategories } from './story'

type CategoryOrder = typeof recognitionCategories
type Direction = -1 | 1

export function getUniqueEarnedAchievements<T extends Pick<AchievementEntry, 'id' | 'credentialKey' | 'credentialType' | 'verified'>>(entries: readonly T[]) {
  const seenCredentials = new Set<string>()
  return entries.filter((entry) => {
    const isEarnedCredential = entry.verified && (
      entry.credentialType === 'award'
      || entry.credentialType === 'certificate'
      || entry.credentialType === 'certification'
    )
    if (!isEarnedCredential) return false
    const credentialId = entry.credentialKey ?? entry.id
    if (seenCredentials.has(credentialId)) return false
    seenCredentials.add(credentialId)
    return true
  })
}

export function getAchievementSequence(entries: AchievementEntry[], categories: CategoryOrder) {
  const earnedAchievements = getUniqueEarnedAchievements(entries)
  return categories.flatMap(({ id }) => earnedAchievements.filter((entry) => entry.category === id))
}

export function getAchievementCategoryCounts(entries: AchievementEntry[], categories: CategoryOrder) {
  const counts = new Map<AchievementCategory, number>(categories.map(({ id }) => [id, 0]))
  for (const entry of getAchievementSequence(entries, categories)) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
  }
  return counts
}

export function getAdjacentAchievementId(
  entries: AchievementEntry[],
  categories: CategoryOrder,
  currentId: string | null,
  currentCategory: AchievementCategory,
  direction: Direction,
) {
  const sequence = getAchievementSequence(entries, categories)
  if (!sequence.length) return null

  const currentIndex = sequence.findIndex((entry) => entry.id === currentId)
  if (currentIndex >= 0) return sequence[(currentIndex + direction + sequence.length) % sequence.length].id

  const categoryIndex = categories.findIndex(({ id }) => id === currentCategory)
  for (let step = 1; step <= categories.length; step += 1) {
    const nextCategory = categories[(categoryIndex + direction * step + categories.length * 2) % categories.length]
    const nextEntry = sequence.find((entry) => entry.category === nextCategory.id)
    if (nextEntry) return nextEntry.id
  }

  return sequence[direction === 1 ? 0 : sequence.length - 1].id
}
