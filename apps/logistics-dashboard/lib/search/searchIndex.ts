import type { WorklistRow } from "@repo/shared"
import type { PoiLocation } from "@/lib/map/poiTypes"

export type SearchEntityType = "shipment" | "case" | "location"

export type SearchItem = {
  id: string
  type: SearchEntityType
  primary: string
  secondary?: string
  tokens: string[]
  payload: Record<string, unknown>
}

export function normalizeToken(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_]/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
}

function uniqTokens(tokens: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of tokens) {
    const nt = normalizeToken(t)
    if (!nt) continue
    if (seen.has(nt)) continue
    seen.add(nt)
    out.push(nt)
  }
  return out
}

export function buildSearchIndex(args: {
  worklistRows?: ReadonlyArray<WorklistRow>
  pois?: ReadonlyArray<PoiLocation>
}): SearchItem[] {
  const items: SearchItem[] = []

  const rows = args.worklistRows ?? []
  for (const r of rows) {
    const hvdc = r.ref.shptNo ?? r.title ?? r.id
    const caseNo = (r.meta?.["case_no"] ?? r.meta?.["caseNo"]) as string | undefined
    const name = (r.meta?.["project_name"] ?? r.meta?.["projectName"] ?? r.subtitle) as string | undefined
    const loc = r.finalLocation ?? r.currentLocation

    const tokens = uniqTokens([
      hvdc ?? "",
      caseNo ?? "",
      name ?? "",
      loc ?? "",
      r.ref.invoiceNo ?? "",
    ])

    if (hvdc) {
      items.push({
        id: `shipment:${hvdc}`,
        type: "shipment",
        primary: hvdc,
        secondary: name ?? loc ?? undefined,
        tokens,
        payload: { hvdc_code: hvdc, case_no: caseNo, location_code: loc },
      })
    }

    if (caseNo) {
      items.push({
        id: `case:${caseNo}`,
        type: "case",
        primary: caseNo,
        secondary: name ?? hvdc ?? undefined,
        tokens,
        payload: { case_no: caseNo, hvdc_code: hvdc, location_code: loc },
      })
    }
  }

  const pois = args.pois ?? []
  for (const p of pois) {
    items.push({
      id: `location:${p.code}`,
      type: "location",
      primary: p.code,
      secondary: p.name,
      tokens: uniqTokens([p.code, p.name, p.summary]),
      payload: { poi_id: p.id, poi_code: p.code, latitude: p.latitude, longitude: p.longitude },
    })
  }

  return items
}

export type SearchResult = SearchItem & { score: number }

function scoreTokenMatch(query: string, token: string): number {
  if (!query || !token) return 0
  if (token === query) return 100
  if (token.startsWith(query)) return 85
  if (token.includes(query)) return 65
  return 0
}

export function searchIndex(args: {
  query: string
  items: ReadonlyArray<SearchItem>
  limit?: number
}): SearchResult[] {
  const q = normalizeToken(args.query)
  if (!q) return []

  const scored: SearchResult[] = []
  for (const it of args.items) {
    let best = 0
    for (const t of it.tokens) {
      best = Math.max(best, scoreTokenMatch(q, t))
      if (best === 100) break
    }

    const typeBoost = it.type === "shipment" ? 3 : it.type === "case" ? 2 : 1
    const score = best * 10 + typeBoost

    if (best > 0) scored.push({ ...it, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, args.limit ?? 12)
}
