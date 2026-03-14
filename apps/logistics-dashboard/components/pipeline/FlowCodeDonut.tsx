'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import { OVERVIEW_ROUTE_TYPES } from '@/lib/overview/routeTypes'
import { chartColors, getRouteTypeBadgeClass, ui } from '@/lib/overview/ui'
import type { OverviewRouteTypeId } from '@/types/overview'
import { useT } from '@/hooks/useT'

const ROUTE_COLORS: Record<OverviewRouteTypeId, string> = {
  'pre-arrival': chartColors.route['pre-arrival'],
  'direct-to-site': chartColors.route['direct-to-site'],
  'via-warehouse': chartColors.route['via-warehouse'],
  'via-mosb': chartColors.route['via-mosb'],
  'via-warehouse-mosb': chartColors.route['via-warehouse-mosb'],
  'review-required': chartColors.route['review-required'],
}

interface FlowCodeDonutProps {
  selectedRouteType?: OverviewRouteTypeId
  onRouteTypeSelect?: (routeType?: OverviewRouteTypeId) => void
}

export function FlowCodeDonut({ selectedRouteType, onRouteTypeSelect }: FlowCodeDonutProps) {
  const t = useT()
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-48 animate-pulse rounded bg-hvdc-surface-subtle" />

  const data = OVERVIEW_ROUTE_TYPES
    .map((routeType) => ({
      id: routeType.id,
      name: routeType.label,
      value: summary.byRouteType[routeType.id] ?? 0,
    }))
    .filter((entry) => entry.value > 0)

  return (
    <div className={`${ui.panelInner} p-3`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-hvdc-text-secondary">{t.pipeline.routeDistribution}</h4>
        {selectedRouteType ? (
          <button
            type="button"
            onClick={() => onRouteTypeSelect?.(undefined)}
            className={`rounded-full border px-2 py-1 text-[11px] ${getRouteTypeBadgeClass(selectedRouteType)}`}
          >
            {OVERVIEW_ROUTE_TYPES.find((routeType) => routeType.id === selectedRouteType)?.label}
          </button>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={70}
            onClick={(entry: { id: OverviewRouteTypeId }) => {
              if (!onRouteTypeSelect) return
              onRouteTypeSelect(selectedRouteType === entry.id ? undefined : entry.id)
            }}
          >
            {data.map((entry) => <Cell key={entry.id} fill={ROUTE_COLORS[entry.id]} />)}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend iconSize={10} wrapperStyle={{ color: chartColors.axis, fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
