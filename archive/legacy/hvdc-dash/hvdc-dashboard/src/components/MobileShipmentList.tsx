// components/MobileShipmentList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, ChevronDown, Package, Ship, MapPin, Calendar } from 'lucide-react'

interface Shipment {
  id: string
  sct_ship_no: string
  vendor: string
  vessel_name: string
  port_of_discharge: string
  eta: string
  ata: string
  status: string
  total_containers: number
}

export default function MobileShipmentList() {
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchShipments()
  }, [statusFilter])

  async function fetchShipments() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)

    const response = await fetch(`/api/shipments?${params}`)
    const result = await response.json()
    setShipments(result.data || [])
    setLoading(false)
  }

  const filteredShipments = shipments.filter(s =>
    s.sct_ship_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vessel_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300'
      case 'arrived': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'in_transit': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return '✅'
      case 'arrived': return '🏢'
      case 'in_transit': return '🚢'
      case 'scheduled': return '📅'
      default: return '⏳'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            🚢 HVDC Shipments
          </h1>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by SCT NO, Vendor, Vessel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters {statusFilter && `(${statusFilter})`}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setShowFilters(false)
                }}
                className="w-full p-2 border border-gray-300 rounded-lg text-base"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_transit">In Transit</option>
                <option value="arrived">Arrived</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-800">
            📊 Showing <strong>{filteredShipments.length}</strong> of {shipments.length} shipments
          </p>
        </div>
      </div>

      {/* Shipment Cards */}
      <div className="px-4 pt-4 space-y-3">
        {filteredShipments.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No shipments found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          filteredShipments.map((shipment, index) => (
            <div
              key={`${shipment.id}-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:shadow-lg transition-shadow"
              onClick={() => router.push(`/shipments/${shipment.id}`)}
            >
              {/* Status Badge */}
              <div className={`px-4 py-2 border-b ${getStatusColor(shipment.status)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {getStatusIcon(shipment.status)} {shipment.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono">
                    {shipment.sct_ship_no}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-4 space-y-3">
                {/* Vendor */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vendor</p>
                  <p className="text-base font-semibold text-gray-900">{shipment.vendor}</p>
                </div>

                {/* Vessel */}
                <div className="flex items-start">
                  <Ship className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vessel</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{shipment.vessel_name}</p>
                  </div>
                </div>

                {/* Port */}
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destination</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{shipment.port_of_discharge}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-purple-500 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {shipment.ata ? 'Arrived' : 'ETA'}
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(shipment.ata || shipment.eta).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Containers */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Containers</p>
                    <p className="text-lg font-bold text-blue-600">{shipment.total_containers}</p>
                  </div>
                </div>
              </div>

              {/* Tap indicator */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">Tap for details →</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-8"></div>
    </div>
  )
}
