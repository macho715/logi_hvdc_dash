#!/usr/bin/env python3
"""
Flow Code v3.5 (Baseline) — runnable reference implementation.

NOTE
- This is a baseline classifier to keep the scaffold executable.
- Replace with your canonical implementation if you already maintain one.

Heuristic (minimal):
- Identify whether shipment has:
  * any warehouse date (excluding MOSB)
  * MOSB date
  * any site arrival date (SHU/MIR/DAS/AGI, typically derived from SHU2/MIR3/DAS4/AGI5)

Flow Code:
0 = Pre-Arrival / no location dates
1 = Port → Site (site only)
2 = Port → WH → Site (warehouse + site)
3 = Port → MOSB → Site (mosb + site)
4 = Port → WH → MOSB → Site (warehouse + mosb + site)
5 = Mixed / Incomplete (e.g., MOSB exists but no site)

Override:
- If Final_Location is AGI or DAS, enforce Flow >= 3 (MOSB leg required).
"""

from __future__ import annotations

from typing import Iterable, List, Optional

import numpy as np
import pandas as pd

DEFAULT_SITE_COLS = ["SHU", "MIR", "DAS", "AGI"]

# Keep this list minimal; prefer to load from config in calling scripts.
DEFAULT_WAREHOUSE_COLS = [
    "DSV Indoor Indoor",
    "DSV Outdoor",
    "DSV MZD",
    "DSV Kizad",
    "JDN MZD",
    "JDN Waterfront",
    "MOSB",
    "AAA Storage",
    "ZENER (WH)",
    "Hauler DG Storage",
    "Vijay Tanks",
]

NULL_STRINGS = {"", " ", "0", "0.0", "O", "o", "nan", "NaN", "NaT", "None", "-", "N/A", "n/a"}


def _present_mask(s: pd.Series) -> pd.Series:
    s_str = s.astype(str).str.strip()
    return s.notna() & ~s_str.isin(NULL_STRINGS)


def _count_present(df: pd.DataFrame, cols: Iterable[str]) -> pd.Series:
    cols = [c for c in cols if c in df.columns]
    if not cols:
        return pd.Series(0, index=df.index)
    cnt = pd.Series(0, index=df.index)
    for c in cols:
        cnt = cnt + _present_mask(df[c]).astype(int)
    return cnt


def calculate_flow_code_v35(
    df: pd.DataFrame,
    warehouse_columns: List[str],
    site_columns: List[str],
    final_location_col: str = "Final_Location",
) -> pd.DataFrame:
    """
    Adds:
      - FLOW_CODE (int)
      - FLOW_CODE_ORIG (int)
      - FLOW_OVERRIDE_REASON (str)
      - FLOW_DESCRIPTION (str)
    """
    df = df.copy()

    wh_cols_excl_mosb = [c for c in warehouse_columns if c != "MOSB"]
    wh_cnt = _count_present(df, wh_cols_excl_mosb)
    has_mosb = _present_mask(df["MOSB"]) if "MOSB" in df.columns else pd.Series(False, index=df.index)
    has_site = _count_present(df, site_columns) > 0

    flow = pd.Series(0, index=df.index, dtype="int64")

    flow = np.where(has_site & ~has_mosb & (wh_cnt == 0), 1, flow)
    flow = np.where(has_site & ~has_mosb & (wh_cnt >= 1), 2, flow)
    flow = np.where(has_site & has_mosb & (wh_cnt == 0), 3, flow)
    flow = np.where(has_site & has_mosb & (wh_cnt >= 1), 4, flow)

    # mixed/incomplete
    flow = np.where(~has_site & has_mosb, 5, flow)
    flow = np.where(~has_site & ~has_mosb & (wh_cnt >= 2), 5, flow)

    flow = pd.Series(flow, index=df.index).astype(int)
    df["FLOW_CODE_ORIG"] = flow

    override_reason = pd.Series([None] * len(df), index=df.index, dtype="object")
    flow_over = flow.copy()

    if final_location_col in df.columns:
        loc = df[final_location_col].astype(str).str.strip().str.upper()
        need_mosb = loc.isin(["AGI", "DAS"])
        forced = need_mosb & (flow_over < 3)
        flow_over = np.where(forced, 3, flow_over)
        override_reason = np.where(forced, "AGI/DAS requires MOSB leg", override_reason)

    df["FLOW_CODE"] = pd.Series(flow_over, index=df.index).astype(int)
    df["FLOW_OVERRIDE_REASON"] = override_reason

    desc = {
        0: "Flow 0: Pre Arrival",
        1: "Flow 1: Port → Site",
        2: "Flow 2: Port → WH → Site",
        3: "Flow 3: Port → MOSB → Site",
        4: "Flow 4: Port → WH → MOSB → Site",
        5: "Flow 5: Mixed / Waiting / Incomplete",
    }
    df["FLOW_DESCRIPTION"] = df["FLOW_CODE"].map(desc)

    return df
