# Copilot / Agent Instructions (Project)

- Follow `AGENTS.md` rules.
- Priority: eliminate async waterfalls → reduce client bundle → server perf → client fetching → re-render.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client.
- Keep Date Canon: compute KPIs/Flow/ETA only from `events(event_type + event_date_dubai)`.

When implementing:
1) Produce a small plan.
2) Make minimal diff.
3) Provide a validation checklist.
