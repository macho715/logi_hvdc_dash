# /system_status quick
Quickly summarize the current project/runtime environment for this repo.

- Treat `C:\LOGI MASTER DASH` as the code root (or `/mnt/c/LOGI\ MASTER\ DASH` inside WSL).
- Always show: current working directory (`pwd`) and the presence of key folders: `apps/`, `packages/`, `src/`, `supabase/`, `scripts/`, `docs/`.
- Print tool versions when available: `node -v`, `pnpm -v`, `python --version`, and `opencode --version`.
- If `opencode` is missing, include the official CLI install snippet for Unix/WSL from `https://opencode.ai/download`.
- Keep the natural-language summary ≤ 5 lines, and include one short code block showing the exact commands you ran.

