'use client';

import * as React from 'react';

import type { SearchItem, SearchResult } from '../../lib/search/searchIndex';
import { searchIndex } from '../../lib/search/searchIndex';

export type GlobalSearchProps = {
  items: ReadonlyArray<SearchItem>;
  onSelect: (item: SearchResult) => void;
  placeholder?: string;
  /** Debounce delay (ms) for re-scoring results */
  debounceMs?: number;
};

function typeLabel(type: SearchResult['type']): string {
  switch (type) {
    case 'shipment':
      return 'Shipment';
    case 'case':
      return 'Case';
    case 'location':
      return 'Location';
    default:
      return 'Item';
  }
}

export function GlobalSearch(props: GlobalSearchProps) {
  const { items, onSelect, placeholder = 'Search ref no / name (e.g., SCT-0011, CASE123..., MIR)', debounceMs = 180 } =
    props;

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listId = React.useId();

  // Debounced search
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchIndex({ query, items, limit: 10 });
      setResults(next);
      setActiveIndex(next.length ? 0 : -1);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [query, items, debounceMs]);

  const handleSelect = React.useCallback(
    (it: SearchResult) => {
      onSelect(it);
      setOpen(false);
      // Keep query for quick iteration, but select all for easy overwrite
      window.setTimeout(() => inputRef.current?.select(), 0);
    },
    [onSelect]
  );

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      }
    }
  };

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
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay close to allow click selection
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        aria-autocomplete="list"
        aria-controls={`${listId}-listbox`}
        aria-expanded={open}
        role="combobox"
      />

      {open && query.trim() && results.length > 0 && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
        >
          {results.map((r, idx) => {
            const active = idx === activeIndex;
            return (
              <li
                key={r.id}
                role="option"
                aria-selected={active}
                className={`cursor-pointer rounded px-2 py-2 text-sm ${
                  active ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  // Prevent input blur before click
                  e.preventDefault();
                }}
                onClick={() => handleSelect(r)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{r.primary}</div>
                    {r.secondary && <div className="truncate text-xs text-slate-600">{r.secondary}</div>}
                  </div>
                  <div className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {typeLabel(r.type)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-lg">
          No matches.
        </div>
      )}
    </div>
  );
}
