# Changelog

## Unreleased

### Added
- feat: add shipments page with forced dynamic rendering
- feat: add `.env.example` template file for environment variables
- feat: add comprehensive work log documentation (`docs/WORK_LOG.md`)
- feat: add `/api/worklist` endpoint for dashboard data aggregation
- feat: implement Asia/Dubai timezone handling for date calculations (`getDubaiToday()`, `getDubaiTimestamp()`)
- feat: add KPI calculation utilities (`calculateKpis()`) - DRI Avg, WSI Avg, Red Count, Overdue, Recoverable AED
- feat: integrate Dashboard component with `/api/worklist` API endpoint
- feat: add `cross-env` package for NODE_ENV management in dev script
- feat: add `worklist-utils.ts` with shipment-to-worklist conversion logic

### Changed
- fix: update development server port from 3005 to 3001 in documentation
- fix: align README.md and IMPLEMENTATION_GUIDE.md with package.json dev script
- refactor: add environment variable validation with explicit error messages
  - `src/lib/supabase.ts`: Add validation for all Supabase environment variables
  - `src/app/api/shipments/[id]/route.ts`: Add validation for API environment variables
- refactor: Dashboard now fetches data from `/api/worklist` instead of using mock data
- refactor: all date comparisons use Asia/Dubai timezone consistently across API and UI
- refactor: improve KPI strip with safe value handling (undefined prevention)

### Improved
- docs: update README.md with environment variable setup instructions
- docs: improve code quality with better type safety (remove non-null assertions)
- docs: add `.env.example` exception in `.gitignore` for template file
- docs: update system architecture to reflect Next.js 16 and `/api/worklist` endpoint
