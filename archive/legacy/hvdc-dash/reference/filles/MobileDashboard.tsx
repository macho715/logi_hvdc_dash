// components/MobileDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react'

interface DashboardStats {
  overview: {
    total_shipments: number
    in_transit_shipments: number
    arrived_shipments: number
    delivered_shipments: number
    total_containers: number
    total_weight_kg: number
    total_cbm: number
  }
  status_breakdown: Record<string, number>
  delayed_shipments: any[]
}

export default function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/statistics')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="p-4 text-center text-red-500">Failed to load statistics</div>
  }

  const { overview, status_breakdown, delayed_shipments } = stats

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-1">HVDC Dashboard</h1>
        <p className="text-blue-100 text-sm">Real-time logistics overview</p>
      </div>

      {/* Main Stats Grid */}
      <div className="px-4 -mt-6 space-y-3">
        {/* Primary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Total Shipments"
            value={overview.total_shipments}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="In Transit"
            value={overview.in_transit_shipments}
            color="yellow"
          />
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Containers"
            value={overview.total_containers}
            color="green"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6" />}
            label="Delivered"
            value={overview.delivered_shipments}
            color="purple"
          />
        </div>

        {/* Delayed Shipments Alert */}
        {delayed_shipments.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800 mb-1">
                  ⚠️ {delayed_shipments.length} Delayed Shipment{delayed_shipments.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-red-700 mb-2">Requires immediate attention</p>
                <div className="space-y-1">
                  {delayed_shipments.slice(0, 3).map((ship, idx) => (
                    <div key={idx} className="text-xs text-red-600 font-mono">
                      • {ship.sct_ship_no} ({ship.days_delayed} days)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Status Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(status_breakdown).map(([status, count]) => {
              const percentage = ((count / overview.total_shipments) * 100).toFixed(1)
              return (
                <StatusBar
                  key={status}
                  status={status}
                  count={count as number}
                  percentage={parseFloat(percentage)}
                />
              )
            })}
          </div>
        </div>

        {/* Weight & Volume */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Weight"
            value={`${(overview.total_weight_kg / 1000000).toFixed(1)}M`}
            unit="kg"
            color="blue"
          />
          <MetricCard
            label="Total Volume"
            value={`${(overview.total_cbm / 1000).toFixed(1)}K`}
            unit="CBM"
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionButton
              label="View All"
              icon="📦"
              onClick={() => window.location.href = '/shipments'}
            />
            <QuickActionButton
              label="In Transit"
              icon="🚢"
              onClick={() => window.location.href = '/shipments?status=in_transit'}
            />
            <QuickActionButton
              label="Delayed"
              icon="⚠️"
              onClick={() => window.location.href = '/shipments?delayed=true'}
            />
            <QuickActionButton
              label="Reports"
              icon="📊"
              onClick={() => window.location.href = '/reports'}
            />
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="px-4 mt-4 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: any) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-orange-500',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-indigo-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs opacity-90 font-medium">{label}</p>
    </div>
  )
}

// Status Bar Component
function StatusBar({ status, count, percentage }: any) {
  const colors: Record<string, string> = {
    delivered: 'bg-green-500',
    arrived: 'bg-blue-500',
    in_transit: 'bg-yellow-500',
    scheduled: 'bg-purple-500',
    pending: 'bg-gray-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {status.replace('_', ' ')}
        </span>
        <span className="text-sm font-bold text-gray-900">{count}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[status] || 'bg-gray-500'} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">{percentage}%</p>
    </div>
  )
}

// Metric Card Component
function MetricCard({ label, value, unit, color }: any) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
  }

  return (
    <div className={`bg-white border-2 ${colors[color]} rounded-xl p-4 shadow-sm`}>
      <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{unit}</p>
    </div>
  )
}

// Quick Action Button
function QuickActionButton({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-lg p-3 text-center transition-all active:scale-95 shadow-sm"
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-semibold text-gray-700">{label}</div>
    </button>
  )
}
