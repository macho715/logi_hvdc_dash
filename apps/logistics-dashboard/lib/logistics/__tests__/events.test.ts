import { describe, expect, it } from 'vitest'
import { generateMockEvents, mapSupabaseEvents } from '@/lib/logistics/events'

describe('logistics event helpers', () => {
  it('maps joined Supabase event rows into dashboard event records', () => {
    const rows = [
      {
        id: 'evt-1',
        location_id: 'loc-port',
        event_type: 'IN_TRANSIT',
        description: 'Loaded at port',
        metadata: { event_date_dubai: '2026-03-15' },
        ts: '2026-03-15T10:00:00.000Z',
        locations: { id: 'loc-port', lat: 24.5, lng: 54.4 },
        shipments: { id: 'ship-1', sct_ship_no: 'HVDC-001' },
      },
    ]

    expect(mapSupabaseEvents(rows)).toEqual([
      {
        event_id: 'evt-1',
        ts: '2026-03-15T10:00:00.000Z',
        shpt_no: 'HVDC-001',
        status: 'IN_TRANSIT',
        location_id: 'loc-port',
        lat: 24.5,
        lon: 54.4,
        remark: 'Loaded at port',
        event_type: 'IN_TRANSIT',
        event_date_dubai: '2026-03-15',
      },
    ])
  })

  it('produces mock events when the live query has no usable rows', () => {
    const mockEvents = generateMockEvents()

    expect(mockEvents.length).toBeGreaterThan(0)
    expect(mockEvents[0]).toMatchObject({
      event_id: expect.any(String),
      ts: expect.any(String),
      shpt_no: expect.any(String),
      status: expect.any(String),
      location_id: expect.any(String),
    })
  })
})
