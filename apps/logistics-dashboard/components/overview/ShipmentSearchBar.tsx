'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLogisticsStore } from '@/store/logisticsStore'
import { normalizeShipmentId } from '@/lib/search/normalizeShipmentId'
import { useT } from '@/hooks/useT'
import { ui } from '@/lib/overview/ui'

interface SearchResult {
  sct_ship_no: string
  vendor: string
  voyage_stage: string
  eta: string | null
  id: string
}

interface Props {
  onSelect: (sctShipNo: string) => void
}

export function ShipmentSearchBar({ onSelect }: Props) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setHighlightedShipmentId = useLogisticsStore((s) => s.setHighlightedShipmentId)

  const doSearch = useCallback(async (raw: string) => {
    const normalized = normalizeShipmentId(raw)
    const params = new URLSearchParams({ pageSize: '5' })
    if (normalized.type === 'exact') {
      params.set('sct_ship_no', normalized.value)
    } else {
      params.set('q', normalized.value)
    }

    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/shipments?${params}`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json() as { data: Array<{ id: string; sct_ship_no: string; vendor: string; voyage_stage: string; eta: string | null }> }
      setResults(
        json.data.map((r) => ({
          id: r.id,
          sct_ship_no: r.sct_ship_no,
          vendor: r.vendor,
          voyage_stage: r.voyage_stage,
          eta: r.eta,
        }))
      )
      setOpen(true)
    } catch {
      setError(true)
      setResults([])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setOpen(false)
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  const handleSelect = (result: SearchResult) => {
    setQuery(result.sct_ship_no)
    setOpen(false)
    setHighlightedShipmentId(result.id)
    onSelect(result.sct_ship_no)
  }

  const handleClear = () => {
    setQuery('')
    setOpen(false)
    setResults([])
    setHighlightedShipmentId(null)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-hvdc-text-secondary">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={t.search.placeholder}
          className={`${ui.input} py-1.5 pl-9 pr-8`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-hvdc-text-secondary hover:text-hvdc-text-primary"
            aria-label="검색 초기화"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className={`absolute top-full z-50 mt-1 w-full ${ui.panelInner}`}>
          {loading && (
            <div className="px-4 py-3 text-sm text-hvdc-text-secondary">{t.search.loading}</div>
          )}
          {!loading && error && (
            <div className="px-4 py-3 text-sm text-hvdc-status-risk">{t.search.error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-hvdc-text-secondary">{t.search.noResults}</div>
          )}
          {!loading && results.map((r) => (
            <div
              key={r.id}
              className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-hvdc-surface-hover"
              onMouseDown={() => handleSelect(r)}
            >
              <div>
                <div className="text-sm font-medium text-hvdc-text-primary">{r.sct_ship_no}</div>
                <div className="text-xs text-hvdc-text-secondary">
                  {r.vendor} · {t.voyageStage[r.voyage_stage as keyof typeof t.voyageStage] ?? r.voyage_stage}
                  {r.eta ? ` · ${t.search.eta} ${r.eta}` : ''}
                </div>
              </div>
              <a
                href={`/cargo?tab=shipments&sct_ship_no=${encodeURIComponent(r.sct_ship_no)}`}
                onMouseDown={(e) => e.stopPropagation()}
                className="ml-2 shrink-0 text-xs text-hvdc-brand hover:text-hvdc-brand-hi hover:underline"
              >
                {t.rightPanel.viewDetail}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
