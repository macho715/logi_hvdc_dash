-- Public vendor list derived from voyage-grain shipments_status table
-- AGENTS.md: shipments_status = voyage grain (not case grain)
CREATE OR REPLACE VIEW public.v_vendor_list AS
SELECT
  vendor,
  COUNT(*) AS shipment_count
FROM status.shipments_status
WHERE vendor IS NOT NULL AND vendor <> ''
GROUP BY vendor
ORDER BY shipment_count DESC, vendor;

GRANT SELECT ON public.v_vendor_list TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
