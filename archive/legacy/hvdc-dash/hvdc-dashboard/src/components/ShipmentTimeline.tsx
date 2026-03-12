'use client'

import { CheckCircle, Clock, Ship, MapPin, Package } from 'lucide-react'

interface ShipmentTimelineProps {
    status: string
    etd?: string | null
    atd?: string | null
    eta?: string | null
    ata?: string | null
    delivery_date?: string | null
}

export default function ShipmentTimeline({ status, etd, atd, eta, ata, delivery_date }: ShipmentTimelineProps) {
    const steps = [
        {
            id: 'pending',
            label: 'Booked',
            date: etd,
            actualDate: atd,
            icon: Clock,
        },
        {
            id: 'in_transit',
            label: 'In Transit',
            date: eta, // Expected arrival
            actualDate: atd ? (ata ? 'Departed' : `Departed: ${new Date(atd).toLocaleDateString()}`) : null,
            icon: Ship,
        },
        {
            id: 'arrived',
            label: 'Arrived',
            date: eta,
            actualDate: ata,
            icon: MapPin,
        },
        {
            id: 'delivered',
            label: 'Delivered',
            date: null,
            actualDate: delivery_date,
            icon: Package,
        },
    ]

    // Helper to determine step status
    const getStepStatus = (stepId: string, index: number) => {
        // Exact match
        if (status === stepId) return 'current'

        // Delivered implies all previous passed
        if (status === 'delivered') return 'completed'

        // Arrived implies in_transit passed
        if (status === 'arrived' && index <= 2) return 'completed'

        // In Transit implies pending passed
        if (status === 'in_transit' && index <= 1) return 'completed'

        // Scheduled/Pending
        if (status === 'scheduled' && index === 0) return 'completed'
        if (stepId === 'pending' && (atd || etd)) return 'completed'

        return 'upcoming'
    }

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Connection Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />

                {steps.map((step, index) => {
                    const stepStatus = getStepStatus(step.id, index)
                    const isCompleted = stepStatus === 'completed'
                    const isCurrent = stepStatus === 'current'

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${isCompleted || isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}
                `}
                            >
                                <step.icon className="w-5 h-5" />
                            </div>
                            <div className="mt-2 text-center">
                                <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>{step.label}</p>
                                <p className="text-xs text-gray-500">
                                    {step.actualDate ? new Date(step.actualDate).toLocaleDateString() :
                                        step.date ? `Est: ${new Date(step.date).toLocaleDateString()}` : '-'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
