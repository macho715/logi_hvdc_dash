# Untitled-4 Embedded OPS TTL v2 (StatusEvent hvdc:atLocation mapping)

## What's new vs v1
- StatusEvent now attempts to map `locationText` -> `hvdc:Location` using `case.locations.csv`.
- When mapping succeeds, it writes:
  - `hvdc:atLocation <{base}/Location/{location_code}>`
- To avoid dangling nodes, it also exports **Location instances** into `hvdc_ops_status.ttl` when locations.csv is available.

## How it finds locations.csv
Priority:
1) `--case-locations /path/to/locations.csv`
2) `./supabase_csv_optionC_v3/locations.csv`
3) `./locations.csv`
4) `{outdir}/supabase_csv_optionC_v3/locations.csv` (and parent)

## Run
```bash
python Untitled-4_embedded_ops_ttl_v2.py \
  --status HVDC_all_status.json \
  --warehouse hvdc_warehouse_status.json \
  --outdir out \
  --base-iri https://example.com/hvdc \
  --case-locations supabase_csv_optionC_v3/locations.csv
```

## Outputs
- out/ontology/hvdc_ops_status.ttl  (Status layer instances + optional Locations + atLocation links)
- out/ontology/hvdc.ttl            (legacy TTL)
