'use client'

import type { ReactNode } from 'react'

interface BentoGridProps {
    children: ReactNode
    className?: string
}

interface BentoGridItemProps {
    children: ReactNode
    className?: string
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
    return (
        <div
            className={`grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-3 ${className}`}
        >
            {children}
        </div>
    )
}

export function BentoGridItem({ children, className = '' }: BentoGridItemProps) {
    return (
        <div
            className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}
        >
            {children}
        </div>
    )
}
