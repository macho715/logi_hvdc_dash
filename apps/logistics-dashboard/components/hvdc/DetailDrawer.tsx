"use client"

import { useEffect, useId, useRef } from "react"
import { selectSelectedCase, useDrawerOpen, useOpsActions, useOpsStore } from "@repo/shared"

export function DetailDrawer({ mode }: { mode: "sidepanel" | "overlay" }) {
  const drawerOpen = useDrawerOpen()
  const actions = useOpsActions()
  const row = useOpsStore(selectSelectedCase)
  const titleId = useId()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (mode !== "overlay") return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = drawerOpen ? "hidden" : originalOverflow
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [drawerOpen, mode])

  useEffect(() => {
    if (mode !== "overlay" || !drawerOpen) return
    const container = contentRef.current
    if (!container) return

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    )

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    first?.focus()
    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen, mode])

  const content = (
    <div
      ref={contentRef}
      className="h-full rounded-xl border border-border bg-card text-foreground"
      role="dialog"
      aria-modal={mode === "overlay"}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="flex items-start justify-between border-b border-border p-4">
        <div>
          <div id={titleId} className="text-sm font-semibold">
            {row?.title ?? "Select an item"}
          </div>
          <div className="text-xs text-muted-foreground">{row?.subtitle ?? "-"}</div>
        </div>
        {mode === "overlay" && (
          <button
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => actions.setDrawerOpen(false)}
          >
            Close
          </button>
        )}
      </div>

      <div className="p-4 text-sm">
        {!row ? (
          <div className="text-muted-foreground">Pick a row from the worklist to view details.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <KV k="Gate" v={row.gate} />
              <KV k="Flow Code" v={row.flowCode?.toString() ?? "-"} />
              <KV k="Score" v={row.score?.toFixed(2) ?? "-"} />
              <KV k="ETA" v={row.eta ?? "-"} />
              <KV k="Due" v={row.dueAt ?? "-"} />
              <KV k="Location" v={row.currentLocation ?? "-"} />
              <KV k="Owner" v={row.owner ?? "-"} />
              <KV k="Final" v={row.finalLocation ?? "-"} />
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="text-[11px] text-muted-foreground">Triggers</div>
              {row.triggers && row.triggers.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.triggers.map((trigger) => (
                    <span
                      key={trigger}
                      className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground">No triggers reported.</div>
              )}
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted/70 p-3 text-xs text-muted-foreground">
              {JSON.stringify(row.meta ?? row, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )

  if (mode === "sidepanel") return content

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => actions.setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[70vh] transform transition-transform ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {content}
      </div>
    </>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <div className="text-[11px] text-muted-foreground">{k}</div>
      <div className="mt-1 font-medium text-foreground">{v}</div>
    </div>
  )
}
