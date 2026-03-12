-- HVDC + Logistics 통합 스키마 (초안)
-- Supabase SSOT 기준

-- Locations: 물류 위치 정보
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  type text, -- 'port', 'warehouse', 'site', etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Location Statuses: 위치별 상태 추적
create table if not exists location_statuses (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  status text not null, -- 'ok', 'warning', 'critical'
  pressure double precision, -- t/m² (≤4.0)
  updated_at timestamptz default now()
);

-- Events: 물류 이벤트 로그
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  event_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- HVDC Worklist: HVDC 워크리스트 항목
create table if not exists hvdc_worklist (
  id uuid primary key default gen_random_uuid(),
  status text not null, -- 'pending', 'in_progress', 'completed'
  title text not null,
  description text,
  eta timestamptz,
  priority integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HVDC KPIs: HVDC KPI 메트릭
create table if not exists hvdc_kpis (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  value numeric not null,
  unit text,
  timestamp timestamptz default now()
);

-- Logs: 시스템 로그
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  level text not null, -- 'info', 'warning', 'error'
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS 정책 예시 (실제 권한은 프로젝트 요구사항에 맞게 조정)
alter table locations enable row level security;
alter table location_statuses enable row level security;
alter table events enable row level security;
alter table hvdc_worklist enable row level security;
alter table hvdc_kpis enable row level security;
alter table logs enable row level security;

-- Realtime 구독 대상 (필요시 활성화)
-- alter publication supabase_realtime add table location_statuses;
-- alter publication supabase_realtime add table hvdc_worklist;
-- alter publication supabase_realtime add table hvdc_kpis;
