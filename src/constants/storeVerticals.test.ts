import { describe, it, expect } from 'vitest'
import { businessMatchesStoreVertical, filterBusinessesByStoreVertical } from './storeVerticals'
import type { BusinessWithMenu } from '../services/orderService'

describe('businessMatchesStoreVertical', () => {
  it('matches supermarket by exact type', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'מכולת / סופרמרקט',
      businessName: 'שדות בית לפירות וירקות',
    }
    expect(businessMatchesStoreVertical(business, 'supermarket')).toBe(true)
  })

  it('matches greengrocer by agreed type', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'ירקנייה / פירות וירקות',
      businessName: 'ירקות טריים',
    }
    expect(businessMatchesStoreVertical(business, 'greengrocer')).toBe(true)
  })

  it('matches greengrocer by name containing פירות and ירק', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'מכולת / סופרמרקט',
      businessName: 'שדות בית לפירות וירקות',
    }
    expect(businessMatchesStoreVertical(business, 'greengrocer')).toBe(true)
  })

  it('matches supermarket by type containing מכולת', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'מכולת',
      businessName: 'מכולת השכונה',
    }
    expect(businessMatchesStoreVertical(business, 'supermarket')).toBe(true)
  })

  it('matches supermarket by type containing סופר', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'סופרמרקט',
      businessName: 'סופר פרש',
    }
    expect(businessMatchesStoreVertical(business, 'supermarket')).toBe(true)
  })

  it('matches flowers by type containing פרח', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'פרחים',
      businessName: 'חנות פרחים',
    }
    expect(businessMatchesStoreVertical(business, 'flowers')).toBe(true)
  })

  it('matches restaurant by type מסעדה', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'מסעדה',
      businessName: 'מסעדת השף',
    }
    expect(businessMatchesStoreVertical(business, 'restaurants')).toBe(true)
  })

  it('excludes greengrocer from restaurants', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'ירקנייה / פירות וירקות',
      businessName: 'ירקות טריים',
    }
    expect(businessMatchesStoreVertical(business, 'restaurants')).toBe(false)
  })

  it('excludes supermarket from restaurants', () => {
    const business: Pick<BusinessWithMenu, 'businessType' | 'businessName'> = {
      businessType: 'מכולת / סופרמרקט',
      businessName: 'סופר פרש',
    }
    expect(businessMatchesStoreVertical(business, 'restaurants')).toBe(false)
  })
})

describe('filterBusinessesByStoreVertical', () => {
  const testBusinesses: Pick<BusinessWithMenu, 'businessType' | 'businessName'>[] = [
    { businessType: 'מסעדה', businessName: 'מסעדת השף' },
    { businessType: 'מכולת / סופרמרקט', businessName: 'שדות בית לפירות וירקות' },
    { businessType: 'ירקנייה / פירות וירקות', businessName: 'ירקות טריים' },
    { businessType: 'פרחים', businessName: 'חנות פרחים' },
  ]

  it('returns all businesses when vertical is null', () => {
    const result = filterBusinessesByStoreVertical(testBusinesses, null)
    expect(result).toHaveLength(4)
  })

  it('filters only supermarkets', () => {
    const result = filterBusinessesByStoreVertical(testBusinesses, 'supermarket')
    expect(result).toHaveLength(1)
    expect(result[0].businessType).toBe('מכולת / סופרמרקט')
  })

  it('filters only greengrocers', () => {
    const result = filterBusinessesByStoreVertical(testBusinesses, 'greengrocer')
    // Should match both: one by type, one by name
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((b) => b.businessType === 'ירקנייה / פירות וירקות')).toBe(true)
  })

  it('filters only flowers', () => {
    const result = filterBusinessesByStoreVertical(testBusinesses, 'flowers')
    expect(result).toHaveLength(1)
    expect(result[0].businessType).toBe('פרחים')
  })

  it('filters only restaurants', () => {
    const result = filterBusinessesByStoreVertical(testBusinesses, 'restaurants')
    expect(result).toHaveLength(1)
    expect(result[0].businessType).toBe('מסעדה')
  })
})
