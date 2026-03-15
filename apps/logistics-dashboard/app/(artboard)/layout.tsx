import type { ReactNode } from 'react'

/**
 * Artboard layout — full-width artboard canvas only.
 * Navigation is embedded inside the artboard SidebarRail (left rail).
 * No external Sidebar — right side is clean.
 */
export default function ArtboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-hud-shell">
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
