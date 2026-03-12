# HVDC Dashboard - Strategic Roadmap & Requirements

## 1. Executive Summary

*   **Philosophy**: The HVDC_LOGISTICS dashboard follows a **Mobile-First, Data-Centric** design philosophy, utilizing high-contrast colors, Inter/Monospace typography, and Lucide icons.
*   **Structure**: Desktop uses a 3-column grid + data tables; Mobile uses card-based layout. Core interactions include filtering and PWA installation.
*   **Key Enhancements**: Interactive KPI Cards, Dark Mode, Offline Capabilities, and Role-Based Dashboards.
*   **Goal**: *Enhance HVDC Dashboard with richer UX—dynamic KPI cards, adaptive themes, and role‑focused views—while preserving its mobile-first minimalism.*

---

## 2. Schema Improvements (Class/Property/Relations)

| Element | Current Design | Proposed Improvement |
| :--- | :--- | :--- |
| **Palette** | Basic Slate-Blue (Primary/Secondary/Success/Warning/Error) | **Project-Site Themes**: Distinct colors for Gate/WH. **Dark Mode**: System-preference aware themes. |
| **Typography** | Inter + Monospace for IDs | **Hierarchy**: Large text for key metrics (OTIF, DEM/DET), smaller for low-priority info. |
| **Components** | Lucide icons, StatCard, StatusBadge, ActionButton | **Role Icons**: (e.g., Finance=CreditCard). **KPI Card**: New component for rich metrics. |
| **Layout** | Desktop: 3-col grid + Table; Mobile: Card List | **Adaptive Grid**: Auto-adjust 2–4 cols. **Mobile**: Swipeable KPI Carousel. |

---

## 3. Integration Strategy

1.  **StatCard + KPI API**: Expand `/api/statistics` to include calculated metrics (OTIF, Customs Lead Time, DEM/DET) for real-time display.
2.  **Enhanced Filtering**: Implement rail-based filter panel (Vendor, Status, Site, Incoterm) with auto-state updates and URL syncing.
3.  **Role-Based Dashboards**:
    *   `finance_user`: Cost cards, currency analysis.
    *   `ops_user`: ETA tracking, berth events.
    *   `compliance_user`: HS Code/Incoterms regulatory cards.

---

## 4. Validation & Quality Assurance

*   **UI Testing**: Ensure 44px touch targets. Check contrast ratios in Dark Mode.
*   **Data Verification**: Validate KPI API values against raw Supabase tables.
*   **SHACL/Business Logic**: Ensure UI badges (Success/Warning) match logic (e.g., `status` = 'Delivered').

---

## 5. Compliance & Regulation

*   **Regulatory UX**: Visual badges for HS Codes requiring FANR/MOIAT certification.
*   **Alerts**: "Call to Action" cards for shipments violating rules (e.g., ETA < 48h with no DO).

---

## 6. Options Analysis

| Option | Pros | Cons | Est. Cost | Risk | Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A) KPI Cards & Dark Mode** | Intuitive data, reduced eye strain | Requires API extension & design work | Medium | Low | 2–3 Weeks |
| **B) Role-Based Dashboards** | Focused views, higher productivity | Auth complexity | Medium | Medium | 3–5 Weeks |
| **C) Offline/PWA** | Field access in low-signal areas | Sync/Cache complexity | Medium | Medium | 4–6 Weeks |

---

## 7. Roadmap (Prepare → Pilot → Build → Operate)

### Phase 1: Prepare (1 Week)
*   Define KPI formulas (OTIF, etc.).
*   Design Dark Mode palette & Tailwind config.

### Phase 2: Pilot (2–3 Weeks)
*   Develop `StatCard` component & update `/api/statistics`.
*   Implement Dark Mode toggle.
*   Basic routing for Role-Based views.

### Phase 3: Build (4–6 Weeks)
*   Implement Service Worker for Offline Mode.
*   Standardize Vendor/ShippingLine data.
*   Develop advanced filters (Incoterm/HS Code).

### Phase 4: Modern UI Reform (Completed)
- [x] **New Layout Architecture**:
  - [x] Implement Sidebar Navigation & Global Header.
  - [x] Create `DashboardLayout` wrapper.
- [x] **Data Workbench Implementation**:
  - [x] `WorklistTable` with Gate logic and Triggers.
  - [x] `DetailDrawer` for side-by-side details.
  - [x] `SavedViews` with Zustand persistence.
- [x] **Performance & Stability**:
  - [x] Fix Hydration errors.
  - [x] Optimize State Selectors (Zustand) to prevent re-renders.

---

## 8. Automation & Hooks

*   **Assisted UX**: Suggest completions for missing HS/Incoterm data.
*   **RPA**: Slack/Telegram notifications for KPI threshold breaches.
*   **Reporting**: Automated export of KPI data to Google Sheets/Excel.

---

## 9. QA Checklist
*   [ ] WCAG AA compliance (Color contrast, Touch targets).
*   [ ] KPI data accuracy verification.
*   [ ] Offline mode functionality test.
*   [ ] Role-based view security check.

---

## 10. Recommendations
*   **Immediate Action**: Start **Phase 2 (Pilot)** - Implement KPI Cards and Dark Mode.
*   **Strategic Goal**: Move towards **Option C (Offline PWA)** for eventual field deployment.
