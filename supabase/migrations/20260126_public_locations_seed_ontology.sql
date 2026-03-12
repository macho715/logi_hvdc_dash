-- 20260126: map locations + seed from map/HVDC_Location_Master_Ontology_with_Coordinates.json
-- Replaces Mock for /api/locations when public.locations is populated.
-- SSOT: map/HVDC_Location_Master_Ontology_with_Coordinates.json

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT,
  address TEXT,
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON public.locations(lat, lng);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read locations anon authenticated" ON public.locations;
CREATE POLICY "Allow read locations anon authenticated"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed from Ontology (10 rows). Deterministic UUIDs for idempotent upsert.
-- LOC-MOSB removed; MOSB YARD unified as LOC-MOSB-SCT-YARD. DSV-M44: M-44; DSV-M19: Office.
INSERT INTO public.locations (id, name, lat, lng, type, region) VALUES
  ('a1000001-0000-5000-8000-000000000001'::uuid, 'Das Island', 25.1477, 52.875, 'HVDC_SITE', NULL),
  ('a1000001-0000-5000-8000-000000000002'::uuid, 'Al Ghallan Island', 24.841096, 53.658619, 'HVDC_SITE', NULL),
  ('a1000001-0000-5000-8000-000000000003'::uuid, 'Mirfa', 24.11885, 53.44436, 'HVDC_SITE', 'Western Region'),
  ('a1000001-0000-5000-8000-000000000004'::uuid, 'Shuweihat', 24.16017, 52.57292, 'HVDC_SITE', 'Western Region'),
  ('a1000001-0000-5000-8000-000000000005'::uuid, 'MOSB-SCT Office', 24.32479, 54.46685, 'OFFICE', 'Mussafah'),
  ('a1000001-0000-5000-8000-000000000010'::uuid, 'MOSB YARD', 24.331414, 54.456911, 'HUB_YARD', 'Mussafah'),
  ('a1000001-0000-5000-8000-000000000006'::uuid, 'DSV Inland WH', 24.347077, 54.47772, 'WAREHOUSE', 'Mussafah'),
  ('a1000001-0000-5000-8000-000000000007'::uuid, 'Khalifa Port (KPCT)', 24.8095, 54.64842, 'GATEWAY_PORT', 'Abu Dhabi'),
  ('a1000001-0000-5000-8000-000000000008'::uuid, 'Mina Zayed Port', 24.52489, 54.37798, 'GATEWAY_PORT', 'Abu Dhabi'),
  ('a1000001-0000-5000-8000-000000000009'::uuid, 'DSV-M19 (Office)', 24.366698, 54.476102, 'OFFICE', 'Mussafah')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  type = EXCLUDED.type,
  region = EXCLUDED.region,
  updated_at = NOW();
