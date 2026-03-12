#!/usr/bin/env python3
"""
Column audit for incoming HVDC_STATUS JSON.

Outputs:
- columns_inventory.json (column name, non-null count, example values)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def load_json(path: Path) -> pd.DataFrame:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        for k in ("data", "records", "items"):
            if k in data and isinstance(data[k], list):
                data = data[k]
                break
    if not isinstance(data, list):
        raise ValueError("JSON top-level must be list[dict] or dict(data/records/items=list).")
    return pd.DataFrame(data)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("-i", "--input", required=True)
    p.add_argument("-o", "--output", default="reports/analysis/columns_inventory.json")
    p.add_argument("--sample", type=int, default=5)
    args = p.parse_args()

    df = load_json(Path(args.input))
    out = []
    for c in df.columns:
        s = df[c]
        non_null = int(s.notna().sum())
        examples = []
        for v in s.dropna().astype(str).head(args.sample).tolist():
            if v not in examples:
                examples.append(v)
        out.append({
            "column": c,
            "non_null": non_null,
            "dtype": str(s.dtype),
            "examples": examples,
        })

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
