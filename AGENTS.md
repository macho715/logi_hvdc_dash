# AGENTS.md — HVDC + Logistics Integrated Dashboard & Supabase↔Foundry Integration

Last updated: 2026-01-23

You are an AI coding assistant working on this repository.
Follow these project rules precisely. If any rule conflicts with a user request, **the user request wins**.

---

## 0) Mission / Scope

- Deliver a **single web application** that unifies:
  - **Logistics** (map: locations/statuses/events/occupancy)
  - **HVDC** (KPI strip + worklist + detail drawer)
- **Supabase is the SSOT** for operational data (Postgres + RLS + Data APIs + Realtime/Webhooks).
- Preserve **HVDC JSON → RDF(Turtle)** pipeline; additionally **normalize operational tables** in Supabase for frontend/API usage.
- Optimize for **desktop + mobile (PWA)** and meet **WCAG 2.2 AA**.

Non-goals (unless explicitly requested):

- Introducing a second operational database besides Supabase.
- Replacing RDF/Ontology/SHACL approach.
- Large UI redesign (reuse existing components first).

---

## 1) Definition of Done & Gates

A change is “done” only if:

- Integrated layout stays intact: **MapView (left) + RightPanel (right) + HVDC Panel (bottom)**.
- Mobile interactions do not regress (bottom panel drag, drawer open/close, one-hand operation).
- Accessibility baseline is met (contrast, keyboard, ARIA, focus/ESC).
- No secrets exposed; no RLS weakening; no client usage of elevated keys.
- Tests are added/updated for changed logic; migrations/docs updated for schema/contract changes.

Decision gates:

- **Gate 1 (Data Model):** Supabase schema + mapping approved.
- **Gate 2 (UI/UX):** ≥80% positive user test feedback.
- **Gate 3 (Performance):** avg < 1s, p95 < 3s for critical flows.

Hard KPIs (integration/validation):

- Sync lag **p95 ≤ 300s**
- Validation latency **p95 < 5s**
- OCR gate: **MeanConf≥0.92 / TableAcc≥0.98 / NumericIntegrity=1.00**
  - If gate fails: **ZERO-fail-safe** (stop downstream automation + ticket)

---

## 2) Expected Stack (Follow repo reality if different)

- Frontend: Next.js 15 + TypeScript + React
- Maps: maplibre-gl + deck.gl
- Backend integration: Supabase (Postgres, Auth, RLS, Data APIs, Realtime, Edge Functions)
- Testing: jest + testing-library (or repo standard)
- Deploy: Vercel

---

## 3) Repo Layout (Target)

Monorepo (recommended):

- /apps/logistics-dashboard
- /apps/hvdc-dashboard
- /packages/ui-components (shared UI)
- /scripts (setup + pipelines)
- /configs (column mapping specs; SSOT)
- /supabase or /migrations (schema + RLS)

Rule discovery:

- **Nearest nested AGENTS.md** (closest to edited code) overrides the root file.

---

## 4) Setup / Commands (SSOT = package.json scripts)

- Detect package manager by lockfile: pnpm / npm / yarn.
- Prefer repo scripts; do not invent commands.
- Prefer **file-scoped** lint/test/typecheck over full builds when possible.

Typical:

```bash
<pm> install
<pm> run dev
<pm> run lint
<pm> run typecheck
<pm> test
```

If Turbo/Turborepo exists, prefer root scripts (they usually wrap filters).

---

## 5) Supabase Data Model (SSOT)

Expected domain tables:

- locations
- location_statuses
- events
- hvdc_kpis
- hvdc_worklist
- logs (pipeline/audit, used columns logs)

Integration-friendly baseline (recommended for Foundry/Ontology ingest):

- core_entity
- core_entity_key
- log_transport_event (raw_payload jsonb 포함)
- doc_registry (doc_hash + OCR metrics)

Rules:

- Any table exposed via Data APIs must have **RLS enabled + explicit policies**.
- Store **normalized columns + raw JSONB** for audit/reprocessing.
- Add indexes on cursor fields (updated_at, event_ts, id) for incremental pulls.
- Realtime: filtered channels, minimal payload, merge/debounce, UI virtualization.

---

## 6) HVDC JSON → RDF(Turtle) Pipeline (Must preserve)

- Script: scripts/core/json_to_ttl.py
- Mapping SSOT: configs/columns.hvdc_status.json
- Script must:
  - parse dates consistently
  - output TTL
  - output used-columns audit log (*.used_cols.json)
- Upload used-columns logs to logs table (or object storage) for analyst verification.

Never:

- silently drop unmapped columns
- change mapping semantics without updating config + audit

---

## 7) Supabase ↔ Foundry/Ontology Integration (4 patterns)

Supabase capabilities map cleanly to these operational patterns:
A) **DB Pull** (Postgres direct/pool)
B) **API Pull** (Supabase Data APIs / REST; RLS-aware)
C) **CDC** (Logical Replication)
D) **Webhook Push** (Database Webhooks)

Default recommendation:

- **(A)+(D)** or **(B)+(D)**: event trigger + deterministic pull for replay/backfill.

### A) DB Pull (bulk/backfill)

Use for: bulk loads, reprocessing, analytics-grade extract.

- Create a **read-only DB role** for Foundry ingestion.
- Incremental loads must be cursor-based + indexed (updated_at/event_ts).
- Consumers must be idempotent (dedupe keys).

### B) API Pull (policy-heavy / network constrained)

Use for: strict network constraints, RLS-based access control.

- Standardize pagination: updated_at cursor + deterministic sort.
- Prefer signed JWT + RLS policies over bypass mechanisms.
- Never use elevated keys from client code.

### C) CDC (ops-mature only)

Use for: near-real-time sync at scale (higher ops complexity).

- Prefer **Outbox table** (stable change envelopes).
- Consumer must be idempotent + checkpointed.
- Define replay strategy + monitoring runbook (slots/lag/errors).

### D) Webhook Push (trigger-only)

Use for: event-driven pipeline triggers.

- Payload must be thin: {table, pk, operation, occurred_at}
- Receiver re-fetches full data via (A) or (B) (**thin webhook, fat pull**).
- Must implement retry/backoff + dead-letter; log failures.

---

## 8) Foundry/Ontology Validation (SHACL / Trust)

Minimum validation constraints:

- flow_code ∈ [0..5] + domain routing rules cross-check
- invoice math integrity:
  - EA×Rate = Amount (±0.01)
  - ΣLine = InvoiceTotal (±2.00%)
- Persist validation outcomes (pass/fail, reasons, timestamps, offending rows/triples).

Human-in-the-loop required for:

- high-value / regulatory cases
- missing critical documents
- unresolved mismatches after automated retries

---

## 9) UI/UX Invariants (Do not break)

Layout:

- MapView left; RightPanel right; HVDC Panel bottom (KpiStrip + Worklist + DetailDrawer)

Theme:

- Dark mode default; panels semi-transparent.

Status colors (consistent everywhere):

- OK green / WARNING amber / CRITICAL red

Signature interactions:

- Bottom panel drag (mobile-first)
- CRITICAL/WARNING glow (brief, non-distracting)

Loading & scale:

- skeletons + incremental loading
- virtualize large lists (events/worklist)
- avoid UI jank on realtime updates

---

## 10) Accessibility (WCAG 2.2 AA baseline)

Global:

- Contrast ≥ 4.5:1
- All interactive elements reachable by keyboard
- ESC closes drawers/modals

Component specifics:

- MapView: do not hijack focus (tabindex -1 where appropriate)
- RightPanel: rows act as buttons with aria-label
- KpiStrip: aria-live="polite" for updates
- Charts: always provide textual summary/table alternative
- DetailDrawer: trap focus; ESC closes; prevent background scroll

---

## 11) Security / Compliance (Non-negotiable)

Keys:

- **NEVER expose service_role (or any secret/admin key)** to browser/mobile/public repo/docs/URLs.
- Elevated keys allowed only on server/edge; sanitize logs.

RLS:

- Treat RLS policies as product contracts; do not weaken without approval.
- Prefer negative tests for policy boundaries when feasible.

Document integrity (UAE/HVDC posture):

- Store original doc in secure storage + doc_hash + strict access control.
- Keep immutable audit logs (who/when/why) for validation decisions.

AGENTS.md is security-critical:

- Treat edits like CI/workflow changes; require codeowner review.

---

## 12) Testing / QA

Before merging:

- typecheck + lint pass
- tests pass for touched areas
- add/update stories (Storybook/MDX) if repo uses them

Always validate:

- Location pin → tooltip → RightPanel selection
- Worklist filter/search → DetailDrawer
- Failure recovery (retry, cached data, offline/connectivity fail)
- Realtime merge/dedupe (no duplicates, no UI jank)

---

## 13) Agent Safety & Permissions

Allowed without asking:

- read/search files; run lint/typecheck/tests
- small, non-destructive refactors; add tests/docs
- add non-breaking migrations (clearly documented)

Ask first:

- dependency installs/upgrades
- breaking schema changes; disabling/weakening RLS
- deleting files; large refactors across apps/packages
- enabling CDC in production
- changes to deploy/CI configuration

---

## 14) PR / Change Management

PR title:

- `[dashboard] <imperative summary>`

Include:

- rationale + screenshots (desktop + mobile) for UI changes
- migration notes + rollback plan for DB/API changes
- testing evidence (commands + results)
- risk notes for realtime/CDC/webhooks

Traceability:

- update CHANGELOG.md for user-visible changes
- link issues to Gate 1/2/3 where applicable

---

## 15) Optional Nested / Override Files

- Add /apps/hvdc-dashboard/AGENTS.md and /apps/logistics-dashboard/AGENTS.md for app-specific commands.
- If supported by your tooling, AGENTS.override.md is **temporary-only** (release freeze / incident). Remove after use.

---

## References (keep short; prefer links over duplication)

Supabase docs:

- Connect to Postgres: https://supabase.com/docs/guides/database/connecting-to-postgres
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Securing Data APIs (RLS): https://supabase.com/docs/guides/api/securing-your-api
- Replication (Logical Replication): https://supabase.com/docs/guides/database/replication
- Database Webhooks: https://supabase.com/docs/guides/database/webhooks
- API keys (service_role / BYPASSRLS): https://supabase.com/docs/guides/api/api-keys
