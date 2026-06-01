import type {
  MoodCollection,
  SmartFilter,
  SpotlightCampaign,
} from '../types/discovery'
import {
  mockMoodCollections,
  mockSmartFilters,
  mockSpotlightCampaign,
} from '../mocks/discovery'

/**
 * טוען נתוני discovery – כרגע ממוקקים בלבד (ללא Firestore).
 */
export const fetchMoodCollections = (): Promise<MoodCollection[]> =>
  Promise.resolve(mockMoodCollections)

export const fetchSmartFilters = (): Promise<SmartFilter[]> =>
  Promise.resolve(mockSmartFilters)

export const fetchSpotlightCampaign = (): Promise<SpotlightCampaign> =>
  Promise.resolve(mockSpotlightCampaign)
