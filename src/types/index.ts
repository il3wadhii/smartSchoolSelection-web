// Type definitions — ported from the RN app (smartSchoolSelection-RN/src/types)
// so web and app stay in sync with the same API shapes.

export interface User {
  userID: number
  name: string
  lastName: string
  email: string
  phone: string
  gender: string
  createdOn?: string
  modifiedOn?: string
  isAdmin?: boolean
}

export interface School {
  schoolID: number
  schoolName: string
  URL?: string
  location?: {
    latitude: number | null
    longitude: number | null
  }
  address: string
  about: string
  languages: string
  system: string
  coedStatus: string
  // fees and seats are null for anonymous visitors (account-only benefit)
  fees: number | null
  phone: string
  createdOn?: string
  modifiedOn?: string
  'Educational Stage': string
  'Number of Student in class': number
  Area: string
  schoolImgURL?: string
  totalAvailableSeats?: number | null
  // List-endpoint extras (Roots redesign)
  rating?: number
  reviewCount?: number
  seatsPublished?: boolean
}

// Detail endpoint reshapes `rating` into an object (average + count)
export interface SchoolDetails extends Omit<School, 'rating'> {
  rating?: {
    average: number | string
    totalReviews: number
  }
  gradeFees?: Array<{ feesID?: number; grade: string; fees: number }> | null
  availability?: Array<{ availabilityID?: number; grade: string; availableSpots: number }> | null
}

export interface Rating {
  ratingID: number
  userID: number
  schoolID?: number
  schoolName?: string
  comment: string
  rating: number
  createdOn?: string
  modifiedOn?: string
  userName?: string
}

export interface RatingStatistics {
  averageRating: number
  totalReviews: number
  ratingBreakdown: {
    [star: string]: number
  }
}

export interface SchoolFilters {
  area?: string
  educationalStage?: string
  language?: string
  feeSort?: 'cheapest' | 'highest'
  classSize?: number
  system?: string
  coedStatus?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}
