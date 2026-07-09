import { describe, expect, it } from 'vitest'
import { buildDestinationAddress } from './deliveryQuoteService'

describe('buildDestinationAddress', () => {
  it('builds Hebrew street + city and appends Israel for geocoding', () => {
    expect(
      buildDestinationAddress({
        delivery_street: 'שחם',
        delivery_building_number: '1',
        delivery_city: 'פתח תקווה',
      }),
    ).toBe('שחם 1, פתח תקווה, ישראל')
  })

  it('does not duplicate Israel suffix', () => {
    expect(
      buildDestinationAddress({
        delivery_street: 'Shaham 1',
        delivery_city: 'Petah Tikva, Israel',
      }),
    ).toBe('Shaham 1, Petah Tikva, Israel')
  })

  it('returns empty for missing parts', () => {
    expect(buildDestinationAddress({})).toBe('')
  })
})
