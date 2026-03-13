import { describe, expect, it } from 'vitest'
import {
  buildDashboardLink,
  getOverviewDestinationConfig,
  parseCargoQuery,
  parsePipelineQuery,
} from '@/lib/navigation/contracts'

describe('navigation contracts', () => {
  it('parses pipeline deep links into typed query state', () => {
    const query = parsePipelineQuery({
      stage: 'warehouse',
      site: 'AGI',
      vendor: 'Hitachi',
      route_type: 'via-mosb',
    })

    expect(query).toEqual({
      stage: 'warehouse',
      site: 'AGI',
      vendor: 'Hitachi',
      route_type: 'via-mosb',
    })
  })

  it('parses cargo deep links into typed query state', () => {
    const query = parseCargoQuery({
      tab: 'shipments',
      site: 'DAS',
      vendor: 'Siemens',
      voyage_stage: 'in-transit',
      route_type: 'via-mosb',
    })

    expect(query).toEqual({
      tab: 'shipments',
      site: 'DAS',
      vendor: 'Siemens',
      voyage_stage: 'in-transit',
      route_type: 'via-mosb',
    })
  })

  it('applies destination defaults and strips unsupported params', () => {
    const href = buildDashboardLink({
      destinationId: 'hero-mandatory-mosb-missing',
      page: 'sites',
      params: {
        site: 'DAS',
        tab: 'route',
      },
    })

    expect(href).toBe('/sites?site=DAS&tab=route')
  })

  it('uses generic page contracts when destination id is omitted', () => {
    const href = buildDashboardLink({
      page: 'pipeline',
      params: {
        stage: 'port',
        route_type: 'direct-to-site',
      },
    })

    expect(href).toBe('/pipeline?stage=port&route_type=direct-to-site')
  })

  it('keeps destination config discoverable for overview actions', () => {
    expect(getOverviewDestinationConfig('pipeline-stage')).not.toBeNull()
    expect(getOverviewDestinationConfig('map-site')?.page).toBe('sites')
  })
})
