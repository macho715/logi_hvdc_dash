'use client'

import { useState, useCallback } from 'react'
import type { NewVoyagePayload } from '@/app/api/shipments/new/route'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void // called after successful insert — parent uses this to trigger refreshKey++
}

const SHIP_MODES = ['Sea', 'Air', 'Land', 'Multi']
const INCOTERMS_LIST = ['CIF', 'FOB', 'EXW', 'DDP', 'DAP', 'CPT', 'CFR']
const SITES = ['SHU', 'MIR', 'DAS', 'AGI'] as const

type SiteKey = 'doc_shu' | 'doc_das' | 'doc_mir' | 'doc_agi'
const SITE_TO_KEY: Record<(typeof SITES)[number], SiteKey> = {
  SHU: 'doc_shu',
  DAS: 'doc_das',
  MIR: 'doc_mir',
  AGI: 'doc_agi',
}

// Internal form state — all fields present for controlled inputs
interface FormState {
  hvdc_code: string
  vendor: string
  pol: string
  pod: string
  ship_mode: string
  incoterms: string
  status_no: number | null
  vessel: string
  bl_awb: string
  etd: string
  atd: string
  eta: string
  ata: string
  transit_days: number | null
  customs_days: number | null
  inland_days: number | null
  doc_shu: boolean
  doc_das: boolean
  doc_mir: boolean
  doc_agi: boolean
  description: string
}

const EMPTY: FormState = {
  hvdc_code: '',
  vendor: '',
  pol: '',
  pod: '',
  ship_mode: 'Sea',
  incoterms: '',
  status_no: null,
  vessel: '',
  bl_awb: '',
  etd: '',
  atd: '',
  eta: '',
  ata: '',
  transit_days: null,
  customs_days: null,
  inland_days: null,
  doc_shu: false,
  doc_das: false,
  doc_mir: false,
  doc_agi: false,
  description: '',
}

function toPayload(form: FormState): NewVoyagePayload {
  return {
    hvdc_code: form.hvdc_code,
    vendor: form.vendor || undefined,
    pol: form.pol || undefined,
    pod: form.pod || undefined,
    ship_mode: form.ship_mode || undefined,
    incoterms: form.incoterms || undefined,
    status_no: form.status_no,
    vessel: form.vessel || undefined,
    bl_awb: form.bl_awb || undefined,
    etd: form.etd || null,
    atd: form.atd || null,
    eta: form.eta || null,
    ata: form.ata || null,
    transit_days: form.transit_days,
    customs_days: form.customs_days,
    inland_days: form.inland_days,
    doc_shu: form.doc_shu,
    doc_das: form.doc_das,
    doc_mir: form.doc_mir,
    doc_agi: form.doc_agi,
    description: form.description || undefined,
  }
}

export function NewVoyageModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hvdc_code.trim()) {
      setSubmitError('SCT SHIP NO는 필수입니다')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/shipments/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setSubmitError(j.error ?? '오류가 발생했습니다')
        return
      }
      setForm({ ...EMPTY })
      onSuccess()
      onClose()
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">항차 등록 / 수정</h2>
          <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-200">
            ×
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          SCT SHIP NO만 필수입니다. 나머지는 아는 정보만 입력하세요.
          <br />
          이미 등록된 코드를 입력하면 <span className="text-blue-400">입력한 필드만 덮어씁니다</span> (업데이트).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: SCT SHIP NO (required) + Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                SCT SHIP NO <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.hvdc_code}
                onChange={(e) => handleChange('hvdc_code', e.target.value)}
                placeholder="HVDC-ADOPT-SCT-0001"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Vendor</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                placeholder="Hitachi"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: POL + POD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">POL (출발항)</label>
              <input
                type="text"
                value={form.pol}
                onChange={(e) => handleChange('pol', e.target.value)}
                placeholder="KRPUS"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">POD (도착항)</label>
              <input
                type="text"
                value={form.pod}
                onChange={(e) => handleChange('pod', e.target.value)}
                placeholder="AEAUH"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Ship Mode + Incoterms + MR No. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">운송 모드</label>
              <select
                value={form.ship_mode}
                onChange={(e) => handleChange('ship_mode', e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {SHIP_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Incoterms</label>
              <select
                value={form.incoterms}
                onChange={(e) => handleChange('incoterms', e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">선택</option>
                {INCOTERMS_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">MR No.</label>
              <input
                type="number"
                value={form.status_no ?? ''}
                onChange={(e) =>
                  handleChange('status_no', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="12345"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Vessel + B/L AWB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">선박명 / 항공편</label>
              <input
                type="text"
                value={form.vessel}
                onChange={(e) => handleChange('vessel', e.target.value)}
                placeholder="MSC AURORA"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                B/L No. / AWB No.
              </label>
              <input
                type="text"
                value={form.bl_awb}
                onChange={(e) => handleChange('bl_awb', e.target.value)}
                placeholder="MSCUABCD1234567"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: ETD + ATD + ETA + ATA */}
          <div className="grid grid-cols-4 gap-3">
            {(['etd', 'atd', 'eta', 'ata'] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  {field.toUpperCase()}
                </label>
                <input
                  type="date"
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Row 6: Transit / Customs / Inland days */}
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['transit_days', '해상 운송일'],
                ['customs_days', '통관일'],
                ['inland_days', '내륙 운송일'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-gray-400">{label}</label>
                <input
                  type="number"
                  value={form[field] ?? ''}
                  onChange={(e) =>
                    handleChange(field, e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Row 7: Site checkboxes */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              납품 현장 노미네이션
            </label>
            <div className="flex gap-4">
              {SITES.map((site) => {
                const key = SITE_TO_KEY[site]
                return (
                  <label key={site} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{site}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Row 8: Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">비고 (설명)</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="추가 정보를 입력하세요..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
