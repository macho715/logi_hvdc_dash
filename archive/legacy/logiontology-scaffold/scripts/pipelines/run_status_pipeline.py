#!/usr/bin/env python3
"""
One-shot pipeline: JSON → TTL + Analytics + Column audit.
"""

from __future__ import annotations

import argparse
import subprocess


def run(cmd: list) -> None:
    print(" ".join(cmd))
    subprocess.check_call(cmd)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("-i", "--input", required=True, help="Input JSON path")
    p.add_argument("--config", required=True, help="Column spec JSON path")
    p.add_argument("--ttl", default="output/ttl/hvdc_status_json.ttl")
    p.add_argument("--report", default="reports/analysis/hvdc_json_analysis.json")
    args = p.parse_args()

    run(["python", "scripts/core/column_audit.py", "-i", args.input, "-o", "reports/analysis/columns_inventory.json"])
    run(["python", "scripts/core/json_to_ttl.py", "-i", args.input, "-o", args.ttl, "--config", args.config])
    run(["python", "scripts/analyze_hvdc_json.py", "-i", args.input, "-o", args.report, "--config", args.config, "--csv-dir", "reports/analysis/csv"])


if __name__ == "__main__":
    main()
