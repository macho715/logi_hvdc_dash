// apps/logistics-dashboard/store/stockStore.ts

import { create } from 'zustand'
import type { StockRow, StockFilter } from '@/types/cases'
import { DEFAULT_STOCK_FILTER } from '@/types/cases'

interface StockStore {
  stock: StockRow[]
  total: number
  filters: StockFilter
  isLoading: boolean

  fetchStock: (params?: Partial<StockFilter & { page?: number }>) => Promise<void>
  setFilter: <K extends keyof StockFilter>(key: K, value: StockFilter[K]) => void
  resetFilters: () => void
}

export const useStockStore = create<StockStore>((set, get) => ({
  stock: [],
  total: 0,
  filters: DEFAULT_STOCK_FILTER,
  isLoading: false,

  fetchStock: async (params = {}) => {
    set({ isLoading: true })
    try {
      const filters = { ...get().filters, ...params }
      const urlParams = new URLSearchParams()
      if (filters.location !== 'all') urlParams.set('location', filters.location)
      if (filters.sku !== 'all') urlParams.set('sku', filters.sku)
      urlParams.set('page', String(params.page ?? 1))
      urlParams.set('pageSize', '50')

      const res = await fetch(`/api/stock?${urlParams.toString()}`)
      const json = await res.json()
      set({ stock: json.data ?? [], total: json.total ?? 0, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value } }))
  },

  resetFilters: () => set({ filters: DEFAULT_STOCK_FILTER }),
}))
