"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"

import type { SearchItem, SearchResult } from "@/lib/search/searchIndex"
import { searchIndex } from "@/lib/search/searchIndex"

export type GlobalSearchProps = {
  items: ReadonlyArray<SearchItem>
  onSelect: (item: SearchResult) => void
  placeholder?: string
  debounceMs?: number
}

function typeLabel(type: SearchResult["type"]): string {
  switch (type) {
    case "shipment":
      return "Shipment"
    case "case":
      return "Case"
    case "location":
      return "Location"
    default:
      return "Item"
  }
}

export function GlobalSearch({
  items,
  onSelect,
  placeholder = "Search ref no / name (e.g., SCT-0011, CASE123..., MIR)",
  debounceMs = 180,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const listId = useId()

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchIndex({ query, items, limit: 10 })
      setResults(next)
      setActiveIndex(next.length ? 0 : -1)
    }, debounceMs)
    return () => window.clearTimeout(t)
  }, [query, items, debounceMs])

  const handleSelect = useCallback(
    (it: SearchResult) => {
      onSelect(it)
      setOpen(false)
      window.setTimeout(() => inputRef.current?.select(), 0)
    },
    [onSelect],
  )

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true)
      return
    }

    if (e.key === "Escape") {
      setOpen(false)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }

    if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <label className="sr-only" htmlFor={listId}>
        Search (ref no, case no, location code/name)
      </label>

      <input
        ref={inputRef}
        id={listId}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        aria-autocomplete="list"
        aria-controls={`${listId}-listbox`}
        aria-expanded={open}
        role="combobox"
      />

      {open && query.trim() && results.length > 0 && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-card p-1 shadow-lg"
        >
          {results.map((r, idx) => {
            const active = idx === activeIndex
            return (
              <li
                key={r.id}
                role="option"
                aria-selected={active}
                className={`cursor-pointer rounded px-2 py-2 text-sm ${
                  active ? "bg-accent/50" : "hover:bg-accent/30"
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault()
                }}
                onClick={() => handleSelect(r)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{r.primary}</div>
                    {r.secondary && <div className="truncate text-xs text-muted-foreground">{r.secondary}</div>}
                  </div>
                  <div className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {typeLabel(r.type)}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-lg">
          No matches.
        </div>
      )}
    </div>
  )
}
