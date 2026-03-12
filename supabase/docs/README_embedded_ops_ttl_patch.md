# Embedded OPS TTL Patch (Untitled-3 / Untitled-4)

## What changed
- TTL export is now embedded inside each script (no external exporter needed).
- Output TTL is aligned to `hvdc_ops_ontology.ttl` (instances only).
- Deterministic instance IRIs (stable):
  - Shipment:   {base}/Shipment/{hvdc_code}
  - StatusEvent:{base}/StatusEvent/{event_id}
  - Case:       {base}/Case/{hvdc_code}/{case_no}
  - Flow:       {base}/Flow/{hvdc_code}/{case_no}
  - Location:   {base}/Location/{location_code}
  - CaseEvent:  {base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}

## Untitled-4 (Status SSOT)
- Always exports legacy TTL: `out/ontology/hvdc.ttl`
- Also exports OPS TTL by default: `out/ontology/hvdc_ops_status.ttl`
- Disable with `--no-ops-ttl`

Example:
```bash
python Untitled-4_embedded_ops_ttl.py --status HVDC_all_status.json --warehouse hvdc_warehouse_status.json --outdir out --base-iri https://example.com/hvdc
```

## Untitled-3 (Option C)
- CSV outputs remain unchanged.
- When `--export-ttl` is set, writes: `{output-dir}/{ttl-name}` (default `hvdc_ops_data.ttl`)
- Optionally copies `hvdc_ops_ontology.ttl` and `hvdc_ops_shapes.ttl` next to the TTL:
  - Provide `--ontology-ttl` and `--shapes-ttl`, or place them in the script folder/cwd for auto-discovery.

Example:
```bash
python Untitled-3_embedded_ops_ttl.py --all hvdc_allshpt_status.json --wh hvdc_warehouse_status.json --customs HVDC_STATUS.json --output-dir supabase_csv_optionC_v3 --export-ttl --base-iri https://example.com/hvdc
```
