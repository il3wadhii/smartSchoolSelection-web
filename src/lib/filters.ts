import { School, SchoolFilters } from '@/types'

// Ported from the RN app (FilterModal.tsx / HomeScreen.filterSchools) so the
// web filters behave exactly like the app's.

export const ALL_EDUCATIONAL_STAGES = [
  'Preschool', 'KG 1', 'KG 2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
]

const getStageOrder = (stage: string): number => {
  const s = stage.toLowerCase().trim()
  if (s.includes('preschool') || s.includes('pre-school') || s.includes('pre school')) return 0
  if (s.includes('kg 1') || s === 'kg1') return 1
  if (s.includes('kg 2') || s === 'kg2') return 2
  const match = s.match(/grade\s*(\d+)/i)
  if (match) return parseInt(match[1], 10) + 2
  return 100
}

export const stageIsInRange = (stage: string, schoolRange: string | undefined): boolean => {
  if (!schoolRange) return false

  const stageOrder = getStageOrder(stage)
  const parts = schoolRange.split('-').map((p) => p.trim())
  if (parts.length === 1) {
    return getStageOrder(parts[0]) === stageOrder
  }

  const minOrder = getStageOrder(parts[0])
  const maxOrder = getStageOrder(parts[1])
  return stageOrder >= minOrder && stageOrder <= maxOrder
}

export const filterSchools = (
  schools: School[],
  searchText: string,
  filters: SchoolFilters
): School[] => {
  let filtered = [...schools]

  if (searchText) {
    const searchLower = searchText.toLowerCase()
    filtered = filtered.filter(
      (school) =>
        school.schoolName.toLowerCase().includes(searchLower) ||
        school.address?.toLowerCase().includes(searchLower) ||
        school.Area?.toLowerCase().includes(searchLower)
    )
  }

  if (filters.area) {
    filtered = filtered.filter((school) => school.Area === filters.area)
  }

  if (filters.educationalStage) {
    filtered = filtered.filter((school) =>
      stageIsInRange(filters.educationalStage!, school['Educational Stage'])
    )
  }

  if (filters.language) {
    filtered = filtered.filter((school) =>
      school.languages?.toLowerCase().includes(filters.language!.toLowerCase())
    )
  }

  if (filters.system) {
    filtered = filtered.filter((school) => school.system === filters.system)
  }

  if (filters.coedStatus) {
    filtered = filtered.filter((school) => school.coedStatus === filters.coedStatus)
  }

  if (filters.classSize !== undefined) {
    const classSize = filters.classSize
    filtered = filtered.filter((school) => {
      const size = school['Number of Student in class']
      if (classSize === 0) return size < 20 // Small
      if (classSize === 20) return size >= 20 && size <= 30 // Medium
      if (classSize === 31) return size > 30 // Large
      return true
    })
  }

  // Fee sorting only does something for logged-in users (anon fees are null)
  if (filters.feeSort === 'cheapest') {
    filtered = [...filtered].sort((a, b) => (a.fees || 0) - (b.fees || 0))
  } else if (filters.feeSort === 'highest') {
    filtered = [...filtered].sort((a, b) => (b.fees || 0) - (a.fees || 0))
  }

  return filtered
}

export const countActiveFilters = (filters: SchoolFilters): number => {
  let count = 0
  if (filters.area) count++
  if (filters.educationalStage) count++
  if (filters.language) count++
  if (filters.system) count++
  if (filters.coedStatus) count++
  if (filters.classSize !== undefined) count++
  if (filters.feeSort) count++
  return count
}
