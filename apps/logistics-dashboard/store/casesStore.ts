import { create } from 'zustand'
import type { CaseRow, CasesFilter, CasesSummary, PipelineStage } from '@/types/cases'
import { DEFAULT_CASES_FILTER } from '@/types/cases'

interface CasesStore {
  cases: CaseRow[]
  summary: CasesSummary | null
  filters: CasesFilter
  activePipelineStage: PipelineStage | null
  selectedCaseId: string | null
  isDrawerOpen: boolean
  isLoading: boolean
  isSummaryLoading: boolean

  fetchCases: () => Promise<void>
  fetchSummary: () => Promise<void>
  setFilter: <K extends keyof CasesFilter>(key: K, value: CasesFilter[K]) => void
  resetFilters: () => void
  setActivePipelineStage: (stage: PipelineStage | null) => void
  openDrawer: (caseId: string) => void
  closeDrawer: () => void
}

function buildCasesUrl(filters: CasesFilter, page = 1, pageSize = 50): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (filters.site !== 'all') params.set('site', filters.site)
  if (filters.route_type && filters.route_type !== 'all') params.set('route_type', filters.route_type)
  if (filters.vendor !== 'all') params.set('vendor', filters.vendor)
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.location !== 'all') params.set('location', filters.location)
  if (filters.status_current !== 'all') {
    const sc = filters.status_current
    if (Array.isArray(sc)) {
      sc.forEach(v => params.append('status_current', v))
    } else {
      params.set('status_current', sc)
    }
  }
  return `/api/cases?${params.toString()}`
}

export const useCasesStore = create<CasesStore>((set, get) => ({
  cases: [],
  summary: null,
  filters: DEFAULT_CASES_FILTER,
  activePipelineStage: null,
  selectedCaseId: null,
  isDrawerOpen: false,
  isLoading: false,
  isSummaryLoading: false,

  fetchCases: async () => {
    set({ isLoading: true })
    try {
      const url = buildCasesUrl(get().filters)
      const res = await fetch(url)
      const json = await res.json()
      set({ cases: json.data ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchSummary: async () => {
    set({ isSummaryLoading: true })
    try {
      const res = await fetch('/api/cases/summary')
      const json = await res.json()
      set({ summary: json, isSummaryLoading: false })
    } catch {
      set({ isSummaryLoading: false })
    }
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value } }))
  },

  resetFilters: () => set({ filters: DEFAULT_CASES_FILTER }),

  setActivePipelineStage: (stage) => set({ activePipelineStage: stage }),

  openDrawer: (caseId) => set({ selectedCaseId: caseId, isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedCaseId: null }),
}))
