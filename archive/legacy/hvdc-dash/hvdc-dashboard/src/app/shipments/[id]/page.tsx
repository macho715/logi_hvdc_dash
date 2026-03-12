'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Anchor, DollarSign, Calendar } from 'lucide-react'
import ShipmentTimeline from '@/components/ShipmentTimeline'

interface ShipmentDetail {
    id: string
    sct_ship_no: string
    vendor: string
    vessel_name: string
    status: string
    etd: string
    atd: string
    eta: string
    ata: string
    delivery_date: string
    port_of_loading: string
    port_of_discharge: string
    total_containers: number // This might need calculation if not in view, but API includes container_details
    container_details: any[]
    financial_transactions: any[]
    main_description: string
}

export default function ShipmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [shipment, setShipment] = useState<ShipmentDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (params.id) {
            fetchShipment(params.id as string)
        }
    }, [params.id])

    async function fetchShipment(id: string) {
        try {
            const res = await fetch(`/api/shipments/${id}`)
            if (!res.ok) throw new Error('Failed to fetch shipment')
            const data = await res.json()
            setShipment(data.data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading Details...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>
    if (!shipment) return <div className="p-8 text-center">Shipment not found</div>

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{shipment.sct_ship_no}</h1>
                        <p className="text-sm text-gray-500">{shipment.vendor} • {shipment.vessel_name}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase
                ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                    shipment.status === 'delayed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                            {shipment.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                {/* Timeline Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Shipment Progress</h2>
                    <ShipmentTimeline
                        status={shipment.status}
                        etd={shipment.etd}
                        atd={shipment.atd}
                        eta={shipment.eta}
                        ata={shipment.ata}
                        delivery_date={shipment.delivery_date}
                    />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Route Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-4">
                            <Anchor className="w-5 h-5 text-blue-500" /> Route Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Port of Loading</span>
                                <span className="font-medium text-right">{shipment.port_of_loading || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Port of Discharge</span>
                                <span className="font-medium text-right">{shipment.port_of_discharge || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Vessel Name</span>
                                <span className="font-medium text-right">{shipment.vessel_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cargo Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-4">
                            <Package className="w-5 h-5 text-orange-500" /> Cargo Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Description</span>
                                <span className="font-medium text-right truncate max-w-[200px]">{shipment.main_description}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Total Containers</span>
                                {/* Check if container_details array exists and sum up or use logic if present */}
                                <span className="font-medium text-right text-lg">
                                    {shipment.container_details && shipment.container_details.length > 0 ?
                                        shipment.container_details[0].total_containers : 0}
                                </span>
                            </div>
                        </div>

                        {/* Detailed Container Breakdown (Simple View) */}
                        {shipment.container_details && shipment.container_details.length > 0 && (
                            <div className="mt-4 pt-4 bg-gray-50 rounded p-3 text-sm">
                                <p className="font-medium mb-2">Breakdown:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {shipment.container_details[0].qty_40hc > 0 && <div>40HC: {shipment.container_details[0].qty_40hc}</div>}
                                    {shipment.container_details[0].qty_20dc > 0 && <div>20DC: {shipment.container_details[0].qty_20dc}</div>}
                                    {shipment.container_details[0].qty_40ot_in > 0 && <div>40OT: {shipment.container_details[0].qty_40ot_in}</div>}
                                    {shipment.container_details[0].qty_40fr_in > 0 && <div>40FR: {shipment.container_details[0].qty_40fr_in}</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
