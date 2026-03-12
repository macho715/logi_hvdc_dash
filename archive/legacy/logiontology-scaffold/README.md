# LogiOntology HVDC — JSON→TTL + Flow Code v3.5 Scaffold (2026-01-23)

This scaffold provides a reproducible, config-driven structure for:
- HVDC_STATUS JSON ingestion
- Flow Code v3.5 classification (baseline implementation)
- JSON → RDF/Turtle (event-based) export
- QA artifacts (used_cols, column inventory)
- Lightweight analytics report (Flow/Site/Vendor)

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# 1) JSON → TTL (+ used_cols audit)
python scripts/core/json_to_ttl.py \
  -i "data/HVDC SATUS.JSON" \
  -o "output/ttl/hvdc_status_json.ttl" \
  --config "configs/columns.hvdc_status.json"

# 2) Analytics report (JSON + MD + CSV summaries)
python scripts/analyze_hvdc_json.py \
  -i "data/HVDC SATUS.JSON" \
  -o "reports/analysis/hvdc_json_analysis.json" \
  --config "configs/columns.hvdc_status.json" \
  --csv-dir "reports/analysis/csv"

# 3) One-shot pipeline (TTL + analytics + column audit)
python scripts/pipelines/run_status_pipeline.py \
  -i "data/HVDC SATUS.JSON" \
  --config "configs/columns.hvdc_status.json"
```

## Key files

- `configs/columns.hvdc_status.json`: **SSOT** column spec (warehouses/sites/aliases/null patterns).
- `models/ttl/schema/patches/2026-01-23_site-arrival.ttl`: ontology patch adding Site Arrival Date properties.
- `rules/shacl/hvdc-quality-gates.ttl`: minimal SHACL quality gates.
- `output/ttl/*.used_cols.json`: audit log of which input columns were actually used.

## Notes

- `scripts/core/flow_code_calc.py` is a **baseline** v3.5 classifier to keep this scaffold runnable.
  Replace it with your canonical Flow Code implementation if you already have one.
