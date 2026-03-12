'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Shipment {
    id: string
    sct_ship_no: string
    vendor: string
    vessel_name: string
    eta: string
    status: string
    total_containers: number
}

export default function ShipmentList() {
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: '',
        vendor: '',
        from_date: '',
        to_date: ''
    })

    useEffect(() => {
        fetchShipments()
    }, [filters])

    async function fetchShipments() {
        setLoading(true)

        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.vendor) params.append('vendor', filters.vendor)
        if (filters.from_date) params.append('from_date', filters.from_date)
        if (filters.to_date) params.append('to_date', filters.to_date)

        // Use API route instead of direct Supabase query if preferred, or use supabase client directly if RLS is set up.
        // The guide suggests using the API route: /api/shipments
        try {
            const response = await fetch(`/api/shipments?${params}`)
            if (!response.ok) throw new Error('Failed to fetch')
            const result = await response.json()

            if (result.data) {
                setShipments(result.data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="container mx-auto p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">HVDC Shipment Status</h1>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="border p-2 rounded"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_transit">In Transit</option>
                    <option value="arrived">Arrived</option>
                    <option value="delivered">Delivered</option>
                </select>

                <input
                    type="text"
                    placeholder="Vendor"
                    value={filters.vendor}
                    onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                    className="border p-2 rounded"
                />

                <input
                    type="date"
                    value={filters.from_date}
                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                    className="border p-2 rounded"
                />

                <input
                    type="date"
                    value={filters.to_date}
                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                    className="border p-2 rounded"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">SCT SHIP NO</th>
                            <th className="border p-2">Vendor</th>
                            <th className="border p-2">Vessel</th>
                            <th className="border p-2">ETA</th>
                            <th className="border p-2">Containers</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map((shipment, index) => (
                            <tr key={`${shipment.id}-${index}`} className="hover:bg-gray-50">
                                <td className="border p-2">{shipment.sct_ship_no}</td>
                                <td className="border p-2">{shipment.vendor}</td>
                                <td className="border p-2">{shipment.vessel_name}</td>
                                <td className="border p-2">
                                    {shipment.eta ? new Date(shipment.eta).toLocaleDateString('en-US') : '-'}
                                </td>
                                <td className="border p-2 text-center">{shipment.total_containers}</td>
                                <td className="border p-2">
                                    <span className={`px-2 py-1 rounded text-sm ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                            shipment.status === 'arrived' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {shipment.status}
                                    </span>
                                </td>
                                <td className="border p-2 text-center">
                                    <Link
                                        href={`/shipments/${shipment.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {shipments.length === 0 && (
                            <tr>
                                <td colSpan={7} className="border p-4 text-center text-gray-500">No shipments found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
