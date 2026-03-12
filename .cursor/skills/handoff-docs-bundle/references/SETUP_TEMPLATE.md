# SETUP

## Purpose
Provide a quick, repeatable setup guide for local development and CI.

## Requirements
- Node.js 18+
- pnpm (or npm/yarn)

## Quick start
1. Copy environment variables:
   - `cp .env.example .env.local`
2. Fill Supabase keys in `.env.local`.
3. Install dependencies:
   - `pnpm install`
4. Run the dev server:
   - `pnpm dev`

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server or edge only)

## Common commands
- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`

## Troubleshooting
- Missing Supabase keys: ensure `.env.local` is populated.
- Port conflicts: stop the conflicting process or change the port.
