import { z } from 'zod'
import routeTypesSource from '../../../../configs/overview.route-types.json'
import type { OverviewRouteTypeConfig, OverviewRouteTypeId } from '@/types/overview'

const routeTypeSchema = z.object({
  version: z.string(),
  routeTypes: z.array(
    z.object({
      id: z.enum([
        'pre-arrival',
        'direct-to-site',
        'via-warehouse',
        'via-mosb',
        'via-warehouse-mosb',
        'review-required',
      ]),
      label: z.string(),
      description: z.string(),
      sortOrder: z.number().int(),
      flowCodes: z.array(z.number().int()),
      accent: z.enum(['slate', 'sky', 'amber', 'orange', 'rose', 'zinc']),
    }),
  ),
})

const parsed = routeTypeSchema.parse(routeTypesSource)

export const ROUTE_TYPE_FALLBACK_ID: OverviewRouteTypeId = 'review-required'
export const OVERVIEW_ROUTE_TYPES: OverviewRouteTypeConfig[] = [...parsed.routeTypes].sort(
  (left, right) => left.sortOrder - right.sortOrder,
)

const routeTypeMap = new Map(
  OVERVIEW_ROUTE_TYPES.map((routeType) => [routeType.id, routeType] as const),
)

const flowCodeRouteTypeMap = new Map<number, OverviewRouteTypeId>()
for (const routeType of OVERVIEW_ROUTE_TYPES) {
  for (const flowCode of routeType.flowCodes) {
    flowCodeRouteTypeMap.set(flowCode, routeType.id)
  }
}

export function getRouteTypeConfig(
  routeTypeId?: string | null,
): OverviewRouteTypeConfig {
  if (routeTypeId && routeTypeMap.has(routeTypeId as OverviewRouteTypeId)) {
    return routeTypeMap.get(routeTypeId as OverviewRouteTypeId)!
  }

  if (routeTypeId && routeTypeId !== ROUTE_TYPE_FALLBACK_ID) {
    console.warn(`[overview.route_types] Unknown route_type "${routeTypeId}", falling back to ${ROUTE_TYPE_FALLBACK_ID}`)
  }

  return routeTypeMap.get(ROUTE_TYPE_FALLBACK_ID)!
}

export function getOverviewRouteTypeIds(): OverviewRouteTypeId[] {
  return OVERVIEW_ROUTE_TYPES.map((routeType) => routeType.id)
}

export function getRouteTypeIdFromFlowCode(flowCode?: number | null): OverviewRouteTypeId {
  if (typeof flowCode === 'number' && flowCodeRouteTypeMap.has(flowCode)) {
    return flowCodeRouteTypeMap.get(flowCode)!
  }

  if (flowCode != null && !flowCodeRouteTypeMap.has(flowCode)) {
    console.warn(`[overview.route_types] Unknown flow_code "${flowCode}", falling back to ${ROUTE_TYPE_FALLBACK_ID}`)
  }

  return ROUTE_TYPE_FALLBACK_ID
}

export function getRouteTypeIdsForFlowCodes(routeTypeId?: string | null): number[] {
  return [...getRouteTypeConfig(routeTypeId).flowCodes]
}

export function isOverviewRouteTypeId(value?: string | null): value is OverviewRouteTypeId {
  return value != null && routeTypeMap.has(value as OverviewRouteTypeId)
}

export function getRouteTypeLabel(routeTypeId?: string | null): string {
  return getRouteTypeConfig(routeTypeId).label
}

export function getRouteTypeDescription(routeTypeId?: string | null): string {
  return getRouteTypeConfig(routeTypeId).description
}

export function aggregateCountsByRouteType(
  countsByFlowCode: Record<string, number>,
): Record<OverviewRouteTypeId, number> {
  const aggregate = OVERVIEW_ROUTE_TYPES.reduce<Record<OverviewRouteTypeId, number>>(
    (acc, routeType) => {
      acc[routeType.id] = 0
      return acc
    },
    {} as Record<OverviewRouteTypeId, number>,
  )

  for (const [rawFlowCode, count] of Object.entries(countsByFlowCode)) {
    const flowCode = Number.parseInt(rawFlowCode, 10)
    const routeTypeId = Number.isNaN(flowCode)
      ? ROUTE_TYPE_FALLBACK_ID
      : getRouteTypeIdFromFlowCode(flowCode)
    aggregate[routeTypeId] += count
  }

  return aggregate
}
