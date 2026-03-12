# HVDC Logistics Dashboard

**Samsung C&T HVDC Lightning Project** - Logistics Management System

A comprehensive dashboard for tracking and managing international shipments, container details, and warehouse inventory specific to the HVDC project. Transformed into a modern enterprise-grade application built with **Next.js 16**, **Supabase**, and **Python**.

---

## 📂 Project Structure

Verified directory structure:

```
HVDC DASH/
├── hvdc-dashboard/     # Next.js Web Application Source
├── data/               # Raw Data Files (HVDC STATUS_1.xlsx)
├── database/           # SQL Schema & Database Scripts
├── docs/               # Documentation (Architecture, Design, Guides)
├── scripts/            # Python ETL & Utility Scripts
└── reference/          # Logs, Backups, and Patch Files
```

---

## 📚 Documentation

The documentation is organized for easy access:

### 1. [System Architecture](./docs/SYSTEM_ARCHITECTURE.md)
*   **Tech Stack**: Next.js 16, Supabase, Tailwind CSS 4.
*   **Data Pipeline**: Automated ETL using Python (`scripts/`).
*   **Database Schema**: Relational PostgreSQL design (`database/`).
*   **API Endpoints**: RESTful API routes including `/api/worklist` for dashboard data aggregation.

### 2. [UI/UX Design](./docs/UI_UX_DESIGN.md)
*   **Design Philosophy**: "Modern Enterprise Cockpit" with Sidebar navigation.
*   **Key Features**:
    *   **Sidebar Layout**: Fixed left navigation for quick access.
    *   **Worklist Workbench**: Operational table with Gate logic (Red/Amber/Green).
    *   **Detail Drawer**: Slide-out panel for deep-diving into shipment specifics.
    *   **Zustand State**: Robust client-side state for filters and saved views.
    *   **Real-time KPI**: Live metrics (DRI Avg, WSI Avg, Red Count, Overdue, Recoverable AED).

### 3. [Mobile Guide](./docs/MOBILE_GUIDE.md)
*   **PWA Support**: Installable on iOS/Android.
*   **Mobile Layout**: Responsive overlays and touch-friendly lists.

### 4. [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)
*   **API Integration**: Complete guide for `/api/worklist` endpoint and Dashboard integration.
*   **Timezone Handling**: Asia/Dubai timezone consistency for date calculations.

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   Python 3.8+ (for data migration)
*   Supabase Account

### 2. Environment Setup
Create `.env.local` in `hvdc-dashboard/` folder:
```ini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: Copy from `.env.example` template if available:
```bash
cp hvdc-dashboard/.env.example hvdc-dashboard/.env.local
# Then fill in your actual values
```

### 3. Data Migration (Optional)
If you need to refresh the database from Excel:
1.  Ensure `HVDC STATUS_1.xlsx` is inside the `data/` folder.
2.  Run the script:
    ```bash
    python scripts/hvdc_migration_script.py
    ```

### 4. Start the Application
Due to common port conflicts, we use **Port 3001**.

```bash
cd hvdc-dashboard
npm install  # First time only
npm run dev
```

*   **Dashboard**: [http://localhost:3001](http://localhost:3001)
*   **API Endpoint**: [http://localhost:3001/api/worklist](http://localhost:3001/api/worklist)

**Note**: The dev script uses `cross-env` to ensure `NODE_ENV=development` for proper PWA configuration.

---

## 🛠 Tech Stack
*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript
*   **State**: Zustand (Client State), Supabase (Remote State)
*   **Styling**: Tailwind CSS, Lucide React Icons
*   **Backend**: Supabase (PostgreSQL), Next.js API Routes
*   **API**: `/api/worklist` endpoint for dashboard data aggregation with KPI calculations
*   **Timezone**: Asia/Dubai timezone handling for consistent date operations

---

## 🔧 Key Features

### Dashboard API Integration
*   **Real-time Data**: Dashboard fetches data from `/api/worklist` endpoint
*   **KPI Calculations**: Server-side calculation of DRI Avg, WSI Avg, Red Count, Overdue, Recoverable AED
*   **Timezone Consistency**: All date comparisons use Asia/Dubai timezone
*   **Auto-refresh**: Data refreshes every 5 minutes automatically

### Worklist Management
*   **Gate Logic**: Automatic classification (GREEN/AMBER/RED/ZERO) based on shipment status
*   **Filtering**: Filter by Gate, Due Date, Owner, and search query
*   **Saved Views**: Persist and restore custom filter combinations
*   **Detail Drawer**: Comprehensive shipment details with multiple tabs

---

## 📊 API Endpoints

### GET `/api/worklist`
Returns dashboard payload with worklist rows and calculated KPIs.

**Response Format**:
```json
{
  "lastRefreshAt": "2026-01-15 14:30",
  "kpis": {
    "driAvg": 85.5,
    "wsiAvg": 0.0,
    "redCount": 3,
    "overdueCount": 5,
    "recoverableAED": 125000.50,
    "zeroStops": 0
  },
  "rows": [...]
}
```

**Features**:
*   Asia/Dubai timezone timestamps
*   Automatic KPI calculation
*   Fallback data on error (prevents UI breakage)

---

## 🔍 Troubleshooting

### Environment Variables
If you see errors about missing environment variables:
1. Check `.env.local` exists in `hvdc-dashboard/` folder
2. Verify all three Supabase keys are set
3. Restart the dev server after changes

### Port Conflicts
If port 3001 is in use:
```bash
# Use a different port
npx next dev -p 3002
```

### Database Connection
If API returns empty data:
1. Verify Supabase credentials in `.env.local`
2. Check database has data: `SELECT COUNT(*) FROM shipments;`
3. Run migration script if needed: `python scripts/hvdc_migration_script.py`

---

© 2026 Samsung C&T. All Rights Reserved.
