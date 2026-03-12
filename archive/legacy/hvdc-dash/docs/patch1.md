## 1) Exec Summary (바로 적용 가능한 Dashboard.tsx 재설계안)

* 업로드된 **HVDC STATUS_1.xlsx** 기준: **755 rows / 753 shipments**, Doc-ready(단순 필드 존재율 기반) **DRI 평균 98.70** 수준이며, 결손 트리거는 **DO 미수령 43건 / Customs Start 미기입 43건 / Delivery Date 미기입 71건 / BL 미기입 2건**으로 확인됩니다.
* **hvdc_data.ttl** 기준: **Case 8,995개**, 이벤트 기반 “현재 위치 추정 가능” 케이스 **6,199개**이며, 위치(예: SHU/DAS/MIR/AGI/MOSB/DSV Indoor/DSV Al Markaz)별 재고 요약을 KPI/뷰에 직접 올릴 수 있습니다.
* 따라서 Dashboard는 “카드 그리드”를 줄이고, **Worklist(운영 스캔) + Detail Drawer(드릴다운) + Saved Views(반복 필터 고정)** 구조가 가장 효율적입니다.
* EN-KR 1L: **Exceptions-first workbench + detail-on-demand drawer = true enterprise cockpit.**

---

## 2) Visual-first (Dashboard.tsx 구조 + 데이터 매핑 표)

### 2.1 Component Tree (Dashboard.tsx 중심)

```mermaid
flowchart TD
  Dash[Dashboard.tsx] --> Kpi[KpiStrip]
  Dash --> Split[WorkbenchSplit]
  Split --> Left[WorklistPanel]
  Split --> Right[DetailDrawer]

  Left --> Views[SavedViewsBar]
  Left --> Tools[WorklistToolbar]
  Left --> Table[WorklistTable]
  Table --> Row[WorklistRow (click -> select)]

  Right --> Tabs[DrawerTabs]
  Tabs --> Ov[Overview]
  Tabs --> Tl[Timeline]
  Tabs --> Docs[Docs/DRI]
  Tabs --> Wh[Warehouse/WSI]
  Tabs --> Cost[Cost/Duty/VAT]
  Tabs --> Ev[Evidence]
```

### 2.2 “HVDC STATUS_1.xlsx → WorklistRow” 필드 매핑(권장)

| WorklistRow 필드         | Source Column (HVDC STATUS_1.xlsx)                                                                          | 규칙(가정: 표시용 최소 규칙)                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id` / `ref.shptNo`    | `SCT SHIP NO.`                                                                                              | Shipment 단위(유니크)                                                                                                   |
| `title`                | `SCT SHIP NO.`                                                                                              | 테이블 1열                                                                                                             |
| `subtitle`             | `VENDOR`, `SHIP\n MODE`, `POL`, `POD`                                                                       | `Vendor · MODE · POL→POD`                                                                                          |
| `eta`                  | `ETA`                                                                                                       | ISO date로 표시                                                                                                       |
| `dueAt`                | `DELIVERY DATE` (없으면 `ETA`)                                                                                 | Due 정렬 기준                                                                                                          |
| `score`(DRI)           | `CI No`, `INVOICE Date`, `COE`, `BL/AWB`, `Vessel`, `ETD`, `ETA`, `DO`, `Customs Start`                     | 존재율 %로 0–100 계산                                                                                                    |
| `gate`                 | 위 트리거 기반                                                                                                    | **RED:** (ETA < today) & (DO or CustomsStart missing) / **AMBER:** (ETA < today) & (Delivery missing) / else GREEN |
| `currentLocation`(표시용) | `MOSB`, `DSV Indoor`, `DSV Outdoor`, `DSV MZD`, `JDN MZD`, `JDN Waterfront`, `SHU2`, `MIR3`, `DAS4`, `AGI5` | “가장 최근 날짜가 찍힌 location”을 현재 위치로 추정                                                                                 |
| `triggers[]`           | `DO Collection`, `Customs Start`, `DELIVERY DATE`, `BL` 등                                                   | MISSING이면 배지 표시                                                                                                    |

> “가정:” DRI/게이트는 **운영 우선의 UI 신호**로만 사용(법적/계약적 단정 아님). 실제 규칙은 추후 PRIME/ORACLE 규칙팩으로 고정 권장.

---

## 3) Options (≥3)

| 옵션    | 구현 범위                                | Pros     | Cons                 |      Cost(공수) | Risk |          Time |
| ----- | ------------------------------------ | -------- | -------------------- | ------------: | ---- | ------------: |
| A     | Worklist + Minimal Drawer(Overview만) | 빠른 적용    | Docs/WH/Cost 드릴다운 부족 |   4.00–6.00 d | Low  |       1.00 wk |
| B(권장) | Worklist + Drawer Tabs + Saved Views | 운영 효율 최대 | 상태/파생 규칙 정리 필요       |  8.00–12.00 d | Med  | 2.00–3.00 wks |
| C     | B + Map/Deck 패널 동시뷰                  | 공간 인지↑   | 성능/상태 복잡도↑           | 12.00–18.00 d | High | 3.00–5.00 wks |

---

## 4) Roadmap (Prepare→Pilot→Build→Operate→Scale) + KPI

1. **Prepare (0.50 wk)**: WorklistRow 스키마 고정, Gate/DRI 규칙을 “표시 규칙”으로 문서화
2. **Pilot (1.00 wk)**: Option A/B로 Dashboard 한 화면 교체, KPI 계측 삽입

   * KPI: **Time-to-first-action ≤ 45.00 sec**, SavedView 사용률 ≥ 60.00%
3. **Build (1.00–2.00 wks)**: Drawer Tabs 확장(Docs/WH/Cost/Evidence), 필터/정렬/키보드 내비 강화
4. **Operate**: TG/Email draft는 “승인 후 발송” Human gate 유지
5. **Scale**: Role 기반(Ops/WH/Finance) Saved Views + RBAC + 감사로그

---

## 5) Code (바로 붙이는 파일 세트) — Dashboard.tsx 중심

아래 코드는 **Tailwind-only(외부 UI 의존 최소)**로 작성했습니다. shadcn/ui가 있으면 버튼/배지/탭만 교체하면 됩니다.

### 5.1 `types/worklist.ts`

```ts
// file: frontend/types/worklist.ts
export type Gate = "GREEN" | "AMBER" | "RED" | "ZERO";
export type RowKind = "SHIPMENT" | "WAREHOUSE" | "COST" | "EXCEPTION" | "ACTION";

export type TriggerBadge =
  | "DOC_MISSING"
  | "DO_MISSING"
  | "CUSTOMS_START_MISSING"
  | "DELIVERY_DATE_MISSING"
  | "BL_MISSING"
  | "INCOTERM_MISSING"
  | "HS_RISK"
  | "DEMDET_RISK";

export interface WorklistRow {
  id: string;
  kind: RowKind;

  title: string;
  subtitle?: string;

  gate: Gate;
  score?: number;         // 0.00–100.00 (DRI/WSI) or Δ%
  dueAt?: string;         // YYYY-MM-DD
  eta?: string;           // YYYY-MM-DD
  owner?: string;
  lastSeenAt?: string;    // YYYY-MM-DD HH:mm

  currentLocation?: string;
  triggers: TriggerBadge[];

  ref: {
    shptNo?: string;
    whName?: string;
    invoiceNo?: string;
  };

  // Drawer 상세에 쓰는 원본 요약(선택)
  meta?: Record<string, unknown>;
}

export interface DashboardPayload {
  lastRefreshAt: string; // YYYY-MM-DD HH:mm (Asia/Dubai)
  kpis: {
    driAvg: number;
    wsiAvg: number;
    redCount: number;
    overdueCount: number;
    recoverableAED: number;
    zeroStops: number;
  };
  rows: WorklistRow[];
}
```

### 5.2 `store/dashboardStore.ts`

```ts
// file: frontend/store/dashboardStore.ts
"use client";

import { create } from "zustand";
import type { DashboardPayload, WorklistRow, Gate, RowKind } from "@/types/worklist";

type WsStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export interface DashboardFilters {
  gate?: Gate | "ALL";
  kind?: RowKind | "ALL";
  owner?: string | "ALL";
  due?: "OVERDUE" | "DUE_7D" | "ALL";
  q?: string;
}

interface DashboardState {
  wsStatus: WsStatus;
  lastRefreshAt?: string;

  rows: WorklistRow[];
  kpis: DashboardPayload["kpis"];

  filters: DashboardFilters;

  // Saved Views (간단 버전)
  savedViews: { id: string; name: string; filters: DashboardFilters }[];
  activeViewId?: string;

  selectedRowId?: string;
  drawerOpen: boolean;
  drawerTab: "overview" | "timeline" | "docs" | "warehouse" | "cost" | "evidence";

  // actions
  setFilters: (next: Partial<DashboardFilters>) => void;
  applyPayload: (payload: DashboardPayload) => void;

  selectRow: (rowId: string) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DashboardState["drawerTab"]) => void;

  setActiveView: (viewId: string) => void;
  saveCurrentView: (name: string) => void;
  deleteView: (viewId: string) => void;
}

const emptyKpis: DashboardPayload["kpis"] = {
  driAvg: 0.00,
  wsiAvg: 0.00,
  redCount: 0,
  overdueCount: 0,
  recoverableAED: 0.00,
  zeroStops: 0,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  wsStatus: "DISCONNECTED",
  rows: [],
  kpis: emptyKpis,
  filters: { gate: "ALL", kind: "ALL", owner: "ALL", due: "ALL", q: "" },

  savedViews: [
    { id: "today_ops", name: "Today Ops", filters: { gate: "ALL", kind: "SHIPMENT", due: "ALL", q: "" } },
    { id: "red_gate", name: "Red Gate", filters: { gate: "RED", kind: "ALL", due: "ALL", q: "" } },
    { id: "overdue", name: "Overdue", filters: { gate: "ALL", kind: "ALL", due: "OVERDUE", q: "" } },
  ],

  drawerOpen: false,
  drawerTab: "overview",

  setFilters: (next) => set({ filters: { ...get().filters, ...next } }),

  applyPayload: (payload) =>
    set({
      lastRefreshAt: payload.lastRefreshAt,
      rows: payload.rows,
      kpis: payload.kpis,
      wsStatus: "CONNECTED",
    }),

  selectRow: (rowId) => set({ selectedRowId: rowId, drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  setDrawerTab: (tab) => set({ drawerTab: tab }),

  setActiveView: (viewId) => {
    const v = get().savedViews.find((x) => x.id === viewId);
    if (!v) return;
    set({ activeViewId: viewId, filters: v.filters });
  },

  saveCurrentView: (name) => {
    const id = crypto.randomUUID();
    const filters = get().filters;
    set({ savedViews: [...get().savedViews, { id, name, filters }] });
  },

  deleteView: (viewId) => set({ savedViews: get().savedViews.filter((v) => v.id !== viewId) }),
}));
```

### 5.3 `components/dashboard/Dashboard.tsx`

```tsx
// file: frontend/components/dashboard/Dashboard.tsx
"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { KpiStrip } from "./KpiStrip";
import { SavedViewsBar } from "./SavedViewsBar";
import { WorklistToolbar } from "./WorklistToolbar";
import { WorklistTable } from "./WorklistTable";
import { DetailDrawer } from "./DetailDrawer";
import type { DashboardPayload } from "@/types/worklist";

export function Dashboard() {
  const applyPayload = useDashboardStore((s) => s.applyPayload);

  // DEV: mock payload 주입 (실운영에서는 WS/REST로 교체)
  useEffect(() => {
    // fetch("/mock/dashboard_payload.json").then(r=>r.json()).then(applyPayload)
    // 여기서는 “연결 지점”만 남김
  }, [applyPayload]);

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-xl border bg-white">
          <div className="flex flex-col gap-3 p-4">
            <SavedViewsBar />
            <WorklistToolbar />
            <WorklistTable />
          </div>
        </section>

        <aside className="hidden lg:block">
          <DetailDrawer mode="sidepanel" />
        </aside>

        {/* mobile drawer overlay */}
        <div className="lg:hidden">
          <DetailDrawer mode="overlay" />
        </div>
      </div>
    </div>
  );
}
```

### 5.4 Worklist / Drawer 핵심 컴포넌트(최소 구현)

#### `WorklistTable.tsx`

```tsx
// file: frontend/components/dashboard/WorklistTable.tsx
"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import type { WorklistRow, Gate } from "@/types/worklist";

function gateClass(g: Gate) {
  if (g === "ZERO") return "bg-black text-white";
  if (g === "RED") return "bg-red-600 text-white";
  if (g === "AMBER") return "bg-amber-500 text-black";
  return "bg-emerald-600 text-white";
}

function fmtDate(d?: string) {
  return d ?? "-";
}

export function WorklistTable() {
  const { rows, filters, selectRow, selectedRowId } = useDashboardStore((s) => ({
    rows: s.rows,
    filters: s.filters,
    selectRow: s.selectRow,
    selectedRowId: s.selectedRowId,
  }));

  const visible = useMemo(() => {
    const q = (filters.q ?? "").toLowerCase().trim();
    const today = "2026-01-10"; // 가정: UI 표시 기준(운영에서는 서버/클라이언트 now로 교체)

    const filtered = rows.filter((r) => {
      if (filters.gate && filters.gate !== "ALL" && r.gate !== filters.gate) return false;
      if (filters.kind && filters.kind !== "ALL" && r.kind !== filters.kind) return false;
      if (filters.owner && filters.owner !== "ALL" && (r.owner ?? "") !== filters.owner) return false;
      if (q && !(r.title.toLowerCase().includes(q) || (r.subtitle ?? "").toLowerCase().includes(q))) return false;

      if (filters.due === "OVERDUE") {
        if (!r.dueAt) return false;
        if (r.dueAt >= today) return false;
      }
      return true;
    });

    // 기본 정렬: gate 우선(RED/ZERO) → dueAt asc
    const gateRank = (g: Gate) => (g === "ZERO" ? 0 : g === "RED" ? 1 : g === "AMBER" ? 2 : 3);
    filtered.sort((a, b) => {
      const gr = gateRank(a.gate) - gateRank(b.gate);
      if (gr !== 0) return gr;
      return (a.dueAt ?? "9999-12-31").localeCompare(b.dueAt ?? "9999-12-31");
    });

    return filtered.slice(0, 50);
  }, [rows, filters]);

  return (
    <div className="overflow-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Gate</th>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">ETA</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-left">Location</th>
            <th className="px-3 py-2 text-left">Triggers</th>
            <th className="px-3 py-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const active = r.id === selectedRowId;
            return (
              <tr
                key={r.id}
                className={`cursor-pointer border-t hover:bg-slate-50 ${active ? "bg-slate-100" : "bg-white"}`}
                onClick={() => selectRow(r.id)}
              >
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${gateClass(r.gate)}`}>
                    {r.gate}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.subtitle ?? "-"}</div>
                </td>
                <td className="px-3 py-2">{fmtDate(r.eta)}</td>
                <td className="px-3 py-2">{fmtDate(r.dueAt)}</td>
                <td className="px-3 py-2">{r.currentLocation ?? "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.triggers.slice(0, 3).map((t) => (
                      <span key={t} className="rounded border bg-white px-1.5 py-0.5 text-xs text-slate-700">
                        {t}
                      </span>
                    ))}
                    {r.triggers.length > 3 && (
                      <span className="rounded border bg-white px-1.5 py-0.5 text-xs text-slate-500">
                        +{r.triggers.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.score?.toFixed(2) ?? "-"}</td>
              </tr>
            );
          })}
          {visible.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                No results (check filters)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

#### `DetailDrawer.tsx`

```tsx
// file: frontend/components/dashboard/DetailDrawer.tsx
"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function DetailDrawer({ mode }: { mode: "sidepanel" | "overlay" }) {
  const { rows, selectedRowId, drawerOpen, closeDrawer, drawerTab, setDrawerTab } =
    useDashboardStore((s) => ({
      rows: s.rows,
      selectedRowId: s.selectedRowId,
      drawerOpen: s.drawerOpen,
      closeDrawer: s.closeDrawer,
      drawerTab: s.drawerTab,
      setDrawerTab: s.setDrawerTab,
    }));

  const row = useMemo(() => rows.find((r) => r.id === selectedRowId), [rows, selectedRowId]);

  const content = (
    <div className="h-full rounded-xl border bg-white">
      <div className="flex items-start justify-between border-b p-4">
        <div>
          <div className="text-sm font-semibold">{row?.title ?? "Select an item"}</div>
          <div className="text-xs text-slate-500">{row?.subtitle ?? "-"}</div>
        </div>
        {mode === "overlay" && (
          <button className="rounded-md border px-2 py-1 text-xs" onClick={closeDrawer}>
            Close
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b p-2 text-xs">
        {(["overview", "timeline", "docs", "warehouse", "cost", "evidence"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDrawerTab(t)}
            className={`rounded-md px-2 py-1 ${
              drawerTab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 text-sm">
        {!row ? (
          <div className="text-slate-500">Pick a row from the worklist to view details.</div>
        ) : drawerTab === "overview" ? (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <KV k="Gate" v={row.gate} />
            <KV k="Score" v={row.score?.toFixed(2) ?? "-"} />
            <KV k="ETA" v={row.eta ?? "-"} />
            <KV k="Due" v={row.dueAt ?? "-"} />
            <KV k="Location" v={row.currentLocation ?? "-"} />
            <KV k="Owner" v={row.owner ?? "-"} />
          </div>
        ) : (
          <pre className="overflow-auto rounded-md bg-slate-50 p-3 text-xs">
            {JSON.stringify(row.meta ?? row, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );

  if (mode === "sidepanel") return content;

  // overlay (mobile)
  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={closeDrawer} aria-hidden="true" />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[70vh] transform transition-transform ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {content}
      </div>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border bg-white p-2">
      <div className="text-[11px] text-slate-500">{k}</div>
      <div className="mt-1 font-medium">{v}</div>
    </div>
  );
}
```

#### `SavedViewsBar.tsx` / `WorklistToolbar.tsx` / `KpiStrip.tsx` (짧게)

```tsx
// file: frontend/components/dashboard/SavedViewsBar.tsx
"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function SavedViewsBar() {
  const { savedViews, setActiveView, saveCurrentView, deleteView } = useDashboardStore((s) => ({
    savedViews: s.savedViews,
    setActiveView: s.setActiveView,
    saveCurrentView: s.saveCurrentView,
    deleteView: s.deleteView,
  }));
  const [name, setName] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {savedViews.map((v) => (
        <div key={v.id} className="flex items-center gap-1">
          <button
            className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-slate-50"
            onClick={() => setActiveView(v.id)}
          >
            {v.name}
          </button>
          {v.id.startsWith("today_") || v.id === "red_gate" || v.id === "overdue" ? null : (
            <button className="text-xs text-slate-500" onClick={() => deleteView(v.id)}>
              ×
            </button>
          )}
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save view name"
          className="h-8 w-36 rounded-md border px-2 text-xs"
        />
        <button
          className="h-8 rounded-md bg-slate-900 px-3 text-xs text-white"
          onClick={() => {
            if (!name.trim()) return;
            saveCurrentView(name.trim());
            setName("");
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
```

```tsx
// file: frontend/components/dashboard/WorklistToolbar.tsx
"use client";

import { useDashboardStore } from "@/store/dashboardStore";

export function WorklistToolbar() {
  const { filters, setFilters } = useDashboardStore((s) => ({ filters: s.filters, setFilters: s.setFilters }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-9 rounded-md border bg-white px-2 text-xs"
        value={filters.gate ?? "ALL"}
        onChange={(e) => setFilters({ gate: e.target.value as any })}
      >
        <option value="ALL">Gate: ALL</option>
        <option value="RED">Gate: RED</option>
        <option value="AMBER">Gate: AMBER</option>
        <option value="GREEN">Gate: GREEN</option>
        <option value="ZERO">Gate: ZERO</option>
      </select>

      <select
        className="h-9 rounded-md border bg-white px-2 text-xs"
        value={filters.due ?? "ALL"}
        onChange={(e) => setFilters({ due: e.target.value as any })}
      >
        <option value="ALL">Due: ALL</option>
        <option value="OVERDUE">Due: OVERDUE</option>
        <option value="DUE_7D">Due: 7D</option>
      </select>

      <input
        className="h-9 w-64 rounded-md border px-2 text-xs"
        placeholder="Search shptNo / vendor / POL / POD..."
        value={filters.q ?? ""}
        onChange={(e) => setFilters({ q: e.target.value })}
      />
    </div>
  );
}
```

```tsx
// file: frontend/components/dashboard/KpiStrip.tsx
"use client";

import { useDashboardStore } from "@/store/dashboardStore";

export function KpiStrip() {
  const { kpis, lastRefreshAt } = useDashboardStore((s) => ({ kpis: s.kpis, lastRefreshAt: s.lastRefreshAt }));

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <Card k="DRI Avg" v={kpis.driAvg.toFixed(2)} />
      <Card k="WSI Avg" v={kpis.wsiAvg.toFixed(2)} />
      <Card k="Red Count" v={kpis.redCount.toFixed(0)} />
      <Card k="Overdue" v={kpis.overdueCount.toFixed(0)} />
      <Card k="Recoverable (AED)" v={kpis.recoverableAED.toFixed(2)} />
      <Card k="Last Refresh" v={lastRefreshAt ?? "-"} />
    </div>
  );
}

function Card({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-slate-500">{k}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{v}</div>
    </div>
  );
}
```

---

## 6) Data Hook (Excel/TTL → JSON payload) — DEV용 1회 변환 스크립트

실제 운영은 WS/DB/ETL로 연결하되, UI 확인을 위해 **HVDC STATUS_1.xlsx + hvdc_data.ttl**을 `dashboard_payload.json`으로 뽑는 스크립트(예시)를 붙입니다.

```python
# file: scripts/build_dashboard_payload.py
import pandas as pd
import rdflib
from rdflib.namespace import RDF
from collections import defaultdict
from datetime import datetime

XLSX = "HVDC STATUS_1.xlsx"
TTL  = "hvdc_data.ttl"
OUT  = "dashboard_payload.json"
TODAY = pd.Timestamp("2026-01-10")  # 운영환경에서는 now()로 교체

def iso_date(x):
    if pd.isna(x): return None
    try:
        return pd.to_datetime(x, errors="coerce").strftime("%Y-%m-%d")
    except Exception:
        return None

def dri_score(row):
    fields = [
        "COMMERCIAL INVOICE No.", "INVOICE Date", "COE", "B/L No./\n AWB No.",
        "VESSEL NAME/\n FLIGHT No.", "ETD", "ETA", "DO Collection", "Customs\n Start"
    ]
    present = 0
    for f in fields:
        v = row.get(f)
        if pd.isna(v): continue
        if isinstance(v, str) and not v.strip(): continue
        present += 1
    return round(present / len(fields) * 100.0, 2)

def gate_and_triggers(row):
    triggers = []
    if pd.isna(row.get("DO Collection")): triggers.append("DO_MISSING")
    if pd.isna(row.get("Customs\n Start")): triggers.append("CUSTOMS_START_MISSING")
    if pd.isna(row.get("DELIVERY DATE")): triggers.append("DELIVERY_DATE_MISSING")
    if pd.isna(row.get("B/L No./\n AWB No.")): triggers.append("BL_MISSING")
    eta = pd.to_datetime(row.get("ETA"), errors="coerce")
    if pd.notna(eta) and eta < TODAY and ("DO_MISSING" in triggers or "CUSTOMS_START_MISSING" in triggers):
        gate = "RED"
    elif pd.notna(eta) and eta < TODAY and ("DELIVERY_DATE_MISSING" in triggers):
        gate = "AMBER"
    else:
        gate = "GREEN"
    return gate, triggers

def current_location_from_dates(row):
    loc_cols = [
        ("MOSB", "MOSB"),
        ("DSV\n Indoor", "DSV Indoor"),
        ("DSV\n Outdoor", "DSV Outdoor"),
        ("DSV\n MZD", "DSV MZD"),
        ("JDN\n MZD", "JDN MZD"),
        ("JDN\n Waterfront", "JDN Waterfront"),
        ("SHU2", "SHU"),
        ("MIR3", "MIR"),
        ("DAS4", "DAS"),
        ("AGI5", "AGI"),
    ]
    best = None
    for col, label in loc_cols:
        v = row.get(col)
        d = pd.to_datetime(v, errors="coerce")
        if pd.isna(d): continue
        if best is None or d > best[0]:
            best = (d, label)
    return best[1] if best else None

def ttl_inventory_rows():
    g = rdflib.Graph()
    g.parse(TTL, format="turtle")
    HVDC = rdflib.Namespace("http://samsung.com/project-logistics#")

    # bnode event info
    event_info = {}
    for bn in set(s for s,p,o in g.triples((None, RDF.type, HVDC.StockEvent)) if isinstance(s, rdflib.BNode)):
        info = {}
        for p,o in g.predicate_objects(bn):
            if p == HVDC.hasEventDate: info["date"] = o.toPython()
            if p == HVDC.hasLocationAtEvent: info["loc"] = str(o)
        event_info[bn] = info

    case_current = {}
    for case in set(s for s,p,o in g.triples((None, RDF.type, HVDC.Case))):
        cand = []
        for p,o in g.predicate_objects(case):
            if p in (HVDC.hasInboundEvent, HVDC.hasOutboundEvent):
                ei = event_info.get(o, {})
                if "date" in ei and "loc" in ei:
                    cand.append((ei["date"], ei["loc"]))
        if cand:
            case_current[case] = max(cand, key=lambda x: x[0])

    agg = defaultdict(int)
    for _, loc in case_current.values():
        agg[loc] += 1

    rows = []
    for loc, cnt in agg.items():
        rows.append({
            "id": f"WH::{loc}",
            "kind": "WAREHOUSE",
            "title": loc,
            "subtitle": "Stock snapshot (TTL)",
            "gate": "GREEN",
            "score": None,
            "dueAt": None,
            "eta": None,
            "owner": None,
            "lastSeenAt": None,
            "currentLocation": loc,
            "triggers": [],
            "ref": {"whName": loc},
            "meta": {"caseCount": cnt},
        })
    return rows

def main():
    df = pd.read_excel(XLSX, sheet_name="시트1", engine="openpyxl")
    rows = []
    for _, r in df.iterrows():
        shpt = r.get("SCT SHIP NO.")
        if pd.isna(shpt): 
            continue
        score = dri_score(r)
        gate, triggers = gate_and_triggers(r)
        loc = current_location_from_dates(r)
        subtitle = f"{r.get('VENDOR','-')} · {r.get('SHIP\\n MODE','-')} · {r.get('POL','-')}→{r.get('POD','-')}"
        rows.append({
            "id": str(shpt),
            "kind": "SHIPMENT",
            "title": str(shpt),
            "subtitle": subtitle,
            "gate": gate,
            "score": score,
            "eta": iso_date(r.get("ETA")),
            "dueAt": iso_date(r.get("DELIVERY DATE")) or iso_date(r.get("ETA")),
            "owner": None,
            "lastSeenAt": None,
            "currentLocation": loc,
            "triggers": triggers,
            "ref": {"shptNo": str(shpt)},
            "meta": {
                "vendor": r.get("VENDOR"),
                "incoterms": r.get("INCOTERMS"),
                "currency": r.get("CURRENCY"),
                "bl_awb": r.get("B/L No./\n AWB No."),
                "do_collection": iso_date(r.get("DO Collection")),
                "customs_start": iso_date(r.get("Customs\n Start")),
                "customs_close": iso_date(r.get("Customs\n Close")),
                "duty_aed": float(r.get("DUTY AMT\n (AED)")) if pd.notna(r.get("DUTY AMT\n (AED)")) else None,
                "vat_aed": float(r.get("VAT AMT\n (AED)")) if pd.notna(r.get("VAT AMT\n (AED)")) else None,
            },
        })

    # KPIs
    dri_avg = round(df.apply(dri_score, axis=1).mean(), 2)
    red_count = sum(1 for x in rows if x["gate"] == "RED")
    overdue_count = sum(1 for x in rows if x.get("dueAt") and x["dueAt"] < "2026-01-10")
    recoverable = round(float(df["DUTY AMT\n (AED)"].fillna(0).sum() + df["VAT AMT\n (AED)"].fillna(0).sum()), 2)

    wh_rows = ttl_inventory_rows()
    payload = {
        "lastRefreshAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "kpis": {
            "driAvg": dri_avg,
            "wsiAvg": 0.00,
            "redCount": red_count,
            "overdueCount": overdue_count,
            "recoverableAED": recoverable,
            "zeroStops": 0,
        },
        "rows": rows + wh_rows,
    }

    import json
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

---

## 7) QA / Recheck (Phase 4 + Worklist/Drawer)

* 1024px / 1440px에서 Worklist 스크롤 + Drawer 고정 폭 정상
* Mobile: row 탭 → overlay drawer 열림, backdrop 탭 → 닫힘, 상태 유지
* Gate/Triggers 표시가 “결손=배지”로 일관(값 생성/보정 금지)
* Empty/No-result 분리(데이터 없음 vs 필터 결과 없음)

---

## 8) 가정 (명시)

* 가정: Worklist 게이트/DRI는 **운영 우선 UI 신호**이며, 계약/통관 준수의 “판정”이 아님.
* 가정: Excel/TTL은 DEV mock 또는 ETL 소스로 사용하고, 운영에서는 WS/DB에서 동일 스키마(JSON)로 공급.

---

## CmdRec (1–3)

* `/switch_mode RHYTHM + /logi-master --fast report` : “KPI+Exceptions+Actions” 1페이지 운영 보드 템플릿 고정
* `/switch_mode LATTICE + /cipl_guard scan --fast` : Drawer의 Docs/DRI 탭 데이터 공급 연결
* `/switch_mode ORACLE + /logi-master kpi-dash` : Gate 규칙/계측(KPI instrumentation) 고정

원하시면, 지금 구조를 **당신 repo의 실제 컴포넌트/라우팅(app router) 파일명에 맞춰** `page.tsx → DashboardLayout → Dashboard.tsx`까지 “정확한 경로 기준”으로 패치 형태(파일 단위)로 재정렬해 드리겠습니다.
