'use client'

import dynamic from 'next/dynamic'

const GlobalMap = dynamic(() => import('@/components/GlobalMap'), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-slate-900" />
})

export default function MapSection() {
    return <GlobalMap />
}
