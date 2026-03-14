import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { KpiProvider } from '@/components/layout/KpiProvider'
import { ui } from '@/lib/overview/ui'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`flex h-screen overflow-hidden ${ui.pageShell}`}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <KpiProvider />
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
