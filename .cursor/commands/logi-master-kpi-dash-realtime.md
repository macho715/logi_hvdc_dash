# /logi-master kpi-dash --realtime
Focus on the real-time KPI dashboard flows for HVDC + logistics.

- Work mainly in `apps/logistics-dashboard`, `apps/hvdc-dashboard`, and `packages/ui-components`.
- Respect the layout invariant from `AGENTS.md`: MapView (left) + RightPanel (right) + HVDC Panel (bottom).
- Prioritize KPI strip + worklist + Supabase Realtime wiring so that p95 latency for critical KPI updates stays < 3.00s.
- Prefer adding or updating tests and stories around KPI behavior rather than broad, unrelated refactors.
- Never weaken RLS or expose secrets; only use Supabase keys in allowed server-side or edge contexts.

