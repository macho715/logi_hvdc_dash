import { describe, expect, it } from 'vitest'
import { normalizeShipmentId } from '../normalizeShipmentId'

describe('normalizeShipmentId', () => {
  // All ilike searches target the sct_ship_no column via ?q= param
  // Constraint: SCT codes with >4 digits (e.g. sct10000) fall to ilike — 4-digit format is the system standard

  it('passes full HVDC- code (with hyphen) through as uppercase exact match', () => {
    expect(normalizeShipmentId('hvdc-adopt-sct-0001')).toEqual({
      type: 'exact',
      value: 'HVDC-ADOPT-SCT-0001',
    })
    expect(normalizeShipmentId('HVDC-ADOPT-SCT-0042')).toEqual({
      type: 'exact',
      value: 'HVDC-ADOPT-SCT-0042',
    })
  })

  it('falls to ilike for "hvdc" without a hyphen (not a valid HVDC code)', () => {
    // "hvdc" alone or "hvdcfoo" is not a valid code — treat as free-text ilike
    expect(normalizeShipmentId('hvdc')).toEqual({ type: 'ilike', value: 'hvdc' })
    expect(normalizeShipmentId('hvdcfoo')).toEqual({ type: 'ilike', value: 'hvdcfoo' })
  })

  it('expands sct short codes with zero-padding to 4 digits', () => {
    expect(normalizeShipmentId('sct0001')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
    expect(normalizeShipmentId('sct001')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
    expect(normalizeShipmentId('sct1')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
    expect(normalizeShipmentId('sct0123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
    expect(normalizeShipmentId('sct123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
    expect(normalizeShipmentId('SCT0123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
  })

  it('falls to ilike for sct codes with >4 digits (out of standard range)', () => {
    // 5+ digit SCT codes are non-standard; let the DB partial-match handle them
    expect(normalizeShipmentId('sct10000')).toEqual({ type: 'ilike', value: 'sct10000' })
  })

  it('strips case prefix and returns ilike on sct_ship_no column for case numbers', () => {
    // e.g. case12345 → ilike %12345% against sct_ship_no
    expect(normalizeShipmentId('case12345')).toEqual({ type: 'ilike', value: '12345' })
    expect(normalizeShipmentId('CASE001')).toEqual({ type: 'ilike', value: '001' })
  })

  it('uses ilike for bare numerics and free text (all against sct_ship_no)', () => {
    expect(normalizeShipmentId('0001')).toEqual({ type: 'ilike', value: '0001' })
    expect(normalizeShipmentId('POSCO')).toEqual({ type: 'ilike', value: 'posco' })
  })

  it('trims whitespace', () => {
    expect(normalizeShipmentId('  sct0001  ')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
  })
})
