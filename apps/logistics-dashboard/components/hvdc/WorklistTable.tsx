"use client"

import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { selectFilteredWorklistRows, useOpsActions, useOpsStore, useSelectedCaseId } from "@repo/shared"
import type { Gate } from "@repo/shared"

const MAX_ROWS = 200

function gateClass(gate: Gate) {
  if (gate === "ZERO") return "bg-black/80 text-white border-white/10"
  if (gate === "RED") return "bg-red-600/80 text-white border-red-500/50"
  if (gate === "AMBER") return "bg-amber-500/80 text-black border-amber-400/50"
  return "bg-emerald-600/80 text-white border-emerald-500/50"
}

export function WorklistTable() {
  const actions = useOpsActions()
  const selectedCaseId = useSelectedCaseId()
  const rows = useOpsStore(useShallow(selectFilteredWorklistRows))

  const visible = useMemo(() => rows.slice(0, MAX_ROWS), [rows])

  return (
    <div className="h-full overflow-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-muted/70 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Gate</th>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => {
            const active = row.id === selectedCaseId
            return (
              <tr
                key={row.id}
                className={`cursor-pointer border-t border-border/60 hover:bg-accent/40 ${
                  active ? "bg-accent/60" : "bg-background"
                }`}
                onClick={() => actions.selectCase(row.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    actions.selectCase(row.id)
                  }
                }}
                aria-label={`Open case ${row.title}`}
                aria-selected={active}
                tabIndex={0}
              >
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-sm font-semibold ${gateClass(row.gate)}`}>
                    {row.gate}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{row.subtitle ?? "-"}</div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.dueAt ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {typeof row.score === "number" ? row.score.toFixed(2) : "-"}
                </td>
              </tr>
            )
          })}
          {visible.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>
                No results (check filters)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
