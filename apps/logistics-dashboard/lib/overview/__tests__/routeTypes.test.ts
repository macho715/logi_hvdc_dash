import { describe, expect, it } from 'vitest'
import {
  OVERVIEW_ROUTE_TYPES,
  ROUTE_TYPE_FALLBACK_ID,
  aggregateCountsByRouteType,
  getRouteTypeIdFromFlowCode,
} from '@/lib/overview/routeTypes'

describe('overview route type config', () => {
  it('maps configured flow codes to public route types', () => {
    expect(getRouteTypeIdFromFlowCode(0)).toBe('pre-arrival')
    expect(getRouteTypeIdFromFlowCode(1)).toBe('direct-to-site')
    expect(getRouteTypeIdFromFlowCode(2)).toBe('via-warehouse')
    expect(getRouteTypeIdFromFlowCode(3)).toBe('via-mosb')
    expect(getRouteTypeIdFromFlowCode(4)).toBe('via-warehouse-mosb')
    expect(getRouteTypeIdFromFlowCode(5)).toBe('review-required')
  })

  it('falls back safely for unknown flow codes', () => {
    expect(getRouteTypeIdFromFlowCode(null)).toBe(ROUTE_TYPE_FALLBACK_ID)
    expect(getRouteTypeIdFromFlowCode(99)).toBe(ROUTE_TYPE_FALLBACK_ID)
  })

  it('aggregates summary counts using config-defined flow code groups', () => {
    const counts = aggregateCountsByRouteType({
      '0': 10,
      '1': 20,
      '2': 30,
      '3': 40,
      '4': 50,
      '5': 60,
    })

    expect(counts['pre-arrival']).toBe(10)
    expect(counts['direct-to-site']).toBe(20)
    expect(counts['via-warehouse']).toBe(30)
    expect(counts['via-mosb']).toBe(40)
    expect(counts['via-warehouse-mosb']).toBe(50)
    expect(counts['review-required']).toBe(60)
  })

  it('keeps route type ids unique in SSOT config', () => {
    const uniqueIds = new Set(OVERVIEW_ROUTE_TYPES.map((routeType) => routeType.id))
    expect(uniqueIds.size).toBe(OVERVIEW_ROUTE_TYPES.length)
  })
})
