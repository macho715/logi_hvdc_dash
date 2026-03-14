import { describe, expect, it } from 'vitest'
import { buildCasesSummary, createEmptyCasesSummary } from '../summary'

const SAMPLE_ROWS = [
  {
    site: 'SHU',
    flow_code: 1,
    status_current: 'Delivered',
    status_location: 'SHU',
    sqm: 10,
    source_vendor: 'Hitachi',
    storage_type: 'Indoor',
  },
  {
    site: 'AGI',
    flow_code: 3,
    status_current: 'In Transit',
    status_location: 'MOSB',
    sqm: 5,
    source_vendor: 'Other Vendor',
    storage_type: 'Outdoor',
  },
] as const

describe('cases summary builder', () => {
  it('returns isolated empty summary objects', () => {
    const first = createEmptyCasesSummary()
    const second = createEmptyCasesSummary()

    first.byStatus.site = 99
    first.bySite.SHU = 77
    first.byRouteType['direct-to-site'] = 55
    first.byVendor.Hitachi = 33
    first.bySqmByLocation.MOSB = 11

    expect(second.byStatus.site).toBe(0)
    expect(second.bySite.SHU).toBe(0)
    expect(second.byRouteType['direct-to-site']).toBe(0)
    expect(second.byVendor.Hitachi ?? 0).toBe(0)
    expect(second.bySqmByLocation.MOSB ?? 0).toBe(0)
  })

  it('builds stable results across repeated calls with the same input', () => {
    const first = buildCasesSummary([...SAMPLE_ROWS])
    const second = buildCasesSummary([...SAMPLE_ROWS])
    const third = buildCasesSummary([...SAMPLE_ROWS])

    expect(first).toEqual(second)
    expect(second).toEqual(third)
    expect(first.total).toBe(2)
    expect(first.byStatus.site).toBe(1)
    expect(first.byStatus.mosb).toBe(1)
    expect(first.bySite.SHU).toBe(1)
    expect(first.bySiteArrived.SHU).toBe(1)
    expect(first.byRouteType['direct-to-site']).toBe(1)
    expect(first.byRouteType['via-mosb']).toBe(1)
    expect(first.byVendor.Hitachi).toBe(1)
    expect(first.byVendor.Other).toBe(1)
  })
})
