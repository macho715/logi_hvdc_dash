export const VALID_SITES = ["SHU", "MIR", "DAS", "AGI"] as const

export type SiteCode = (typeof VALID_SITES)[number]

const SITE_SET = new Set<string>(VALID_SITES)
const LAND_SITE_SET = new Set<SiteCode>(["SHU", "MIR"])
const ISLAND_SITE_SET = new Set<SiteCode>(["DAS", "AGI"])

const ORIGIN_LOOKUPS: Array<[string, string]> = [
  ["antwerp", "BE"],
  ["brussels", "BE"],
  ["itagui", "CO"],
  ["shanghai", "CN"],
  ["osaka", "JP"],
  ["kobe", "JP"],
  ["hamburg", "DE"],
  ["bremerhaven", "DE"],
  ["frankfurt", "DE"],
  ["norden ham", "DE"],
  ["nordenham", "DE"],
  ["gothenburg", "SE"],
  ["malmoe", "SE"],
  ["uddevalla", "SE"],
  ["norrkoping", "SE"],
  ["copenhagen", "DK"],
  ["billund", "DK"],
  ["amsterdam", "NL"],
  ["geneve", "CH"],
  ["istanbul", "TR"],
  ["jebel ali", "AE"],
  ["abu dhabi", "AE"],
  ["port of pozzuoli", "IT"],
  ["la spezia", "IT"],
  ["venezia", "IT"],
  ["venice", "IT"],
  ["milan", "IT"],
  ["malpensa", "IT"],
  ["genoa", "IT"],
  ["busan", "KR"],
  ["incheon", "KR"],
  ["dangjin", "KR"],
  ["port klang", "MY"],
  ["muscat", "OM"],
  ["le havre", "FR"],
  ["cdg", "FR"],
  ["barcelona", "ES"],
  ["vitoria-gasteiz", "ES"],
  ["linz", "AT"],
  ["koper", "SI"],
  ["london", "GB"],
  ["nhava sheva", "IN"],
  ["tuticorin", "IN"],
  ["visakhapatnam", "IN"],
  ["kairo", "EG"],
  ["cairo", "EG"],
  ["talinn", "EE"],
  ["tallinn", "EE"],
  ["varna", "BG"],
  ["muharraq", "BH"],
]

function titleCaseWord(word: string): string {
  if (!word) return word
  return word[0].toUpperCase() + word.slice(1).toLowerCase()
}

export function normalizeSite(raw: string | number | null | undefined): SiteCode | null {
  if (raw == null) return null
  const value = String(raw).trim().toUpperCase()
  return SITE_SET.has(value) ? (value as SiteCode) : null
}

export function isIslandSite(site: string | null | undefined): boolean {
  return site != null && ISLAND_SITE_SET.has(site as SiteCode)
}

export function getSiteKind(site: string | null | undefined): "land" | "island" | "unknown" {
  if (site != null && LAND_SITE_SET.has(site as SiteCode)) return "land"
  if (site != null && ISLAND_SITE_SET.has(site as SiteCode)) return "island"
  return "unknown"
}

export function normalizeCaseVendor(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  const upper = value.toUpperCase()
  if (upper === "HITACHI") return "Hitachi"
  if (upper === "SIEMENS") return "Siemens"
  return value
}

export function normalizeShipmentVendor(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  if (value.toUpperCase() === "HITACHI") return "Hitachi"
  if (value.toUpperCase() === "SIEMENS") return "Siemens"
  return value
    .split(/\s+/)
    .map(titleCaseWord)
    .join(" ")
}

export function normalizeShipMode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim().toUpperCase()
  if (value === "C") return "Container"
  if (value === "B") return "Bulk"
  if (value === "A") return "Air"
  if (value === "L") return "LCL"
  return raw.trim()
}

export function normalizePortName(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (!value) return null
  if (value.includes("khalifa")) return "Khalifa Port"
  if (value.includes("mina zayed")) return "Mina Zayed"
  if (value.includes("jebel ali")) return "Jebel Ali"
  if (value.includes("abu dhabi airport") || value.includes("auh")) return "AUH Airport"
  return null
}

export function extractOriginCountry(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null

  if (/^[A-Z]{2}[A-Z0-9]{3,}$/.test(value)) {
    return value.slice(0, 2)
  }

  if (/^[A-Z]{2}$/.test(value)) {
    return value
  }

  const lower = value.toLowerCase()
  const direct = ORIGIN_LOOKUPS.find(([snippet]) => lower.includes(snippet))
  return direct?.[1] ?? null
}
