# -*- coding: utf-8 -*-
"""
HVDC Flow Code 분리 스크립트
참조: hvdc_excel_reporter_final_sqm_rev.py
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Flow Code 매핑 (참조 파일 기준)
FLOW_CODES = {
    0: "Pre Arrival",
    1: "Port → Site",
    2: "Port → WH → Site",
    3: "Port → WH → MOSB → Site",
    4: "Port → WH → WH → MOSB → Site",
}

# 창고 컬럼 (MOSB 제외)
WH_COLS = [
    "DSV_INDOOR",
    "DSV_OUTDOOR",
    "DSV_MZD",
    "DSV_KIZAD",
    "JDN_MZD",
    "JDN_WATERFRONT",
    "AAA_STORAGE",
    "ZENER_(WH)",
    "HAULER_DG_STORAGE",
    "VIJAY_TANKS",
]

# MOSB 컬럼
MOSB_COLS = ["MOSB"]

# 현장 컬럼
SITE_COLS = ["SHU2", "MIR3", "DAS4", "AGI5"]

# 제외할 vendor 목록
EXCLUDED_VENDORS = ["hitachi", "siemens"]


def calculate_flow_code(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flow Code 계산 (참조 파일의 _override_flow_code 로직 + AGI/DAS 규칙 적용)
    """
    df = df.copy()
    
    # ① 빈 값 처리 (날짜 형식 포함)
    for col in WH_COLS + MOSB_COLS:
        if col in df.columns:
            # 날짜 형식으로 변환 시도
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            except:
                pass
            # 0값과 빈 문자열을 NaN으로 치환
            df[col] = df[col].replace({0: np.nan, "": np.nan, "0": np.nan})
            # NaT (Not a Time)도 NaN으로 처리
            if df[col].dtype == 'datetime64[ns]':
                df[col] = df[col].where(pd.notna(df[col]), np.nan)
    
    # ② Pre Arrival 판별 (Status_Location 컬럼 확인)
    status_col = "Status_Location"
    if status_col in df.columns:
        is_pre_arrival = df[status_col].astype(str).str.contains(
            "Pre Arrival", case=False, na=False
        )
    else:
        is_pre_arrival = pd.Series(False, index=df.index)
        logger.warning(f"'{status_col}' 컬럼을 찾을 수 없음 - Pre Arrival 판별 불가")
    
    # ③ 창고 Hop 수 + Offshore 계산
    available_wh_cols = [col for col in WH_COLS if col in df.columns]
    available_mosb_cols = [col for col in MOSB_COLS if col in df.columns]
    
    if available_wh_cols:
        # 날짜 형식이든 숫자든 notna()로 체크
        wh_cnt = df[available_wh_cols].notna().sum(axis=1)
    else:
        wh_cnt = pd.Series(0, index=df.index)
        logger.warning("창고 컬럼을 찾을 수 없음")
    
    if available_mosb_cols:
        # MOSB 경유 여부 (날짜 형식 포함)
        offshore = df[available_mosb_cols].notna().any(axis=1).astype(int)
    else:
        offshore = pd.Series(0, index=df.index)
        logger.warning("MOSB 컬럼을 찾을 수 없음")
    
    # ④ Flow Code 계산 (AGI/DAS 규칙 적용)
    base_step = 1  # Port → Site 기본 1스텝
    
    # MOSB가 있으면 최소 Flow Code 3 (AGI/DAS 규칙)
    # MOSB 없으면: wh_cnt + 1
    # MOSB 있으면: max(3, wh_cnt + offshore + 1)
    flow_raw = np.where(
        offshore > 0,
        np.maximum(3, wh_cnt + offshore + base_step),  # MOSB 있으면 최소 3
        wh_cnt + base_step  # MOSB 없으면 wh_cnt + 1
    )
    
    # Pre Arrival은 무조건 0, 나머지는 1~4로 클립
    df["FLOW_CODE"] = np.where(
        is_pre_arrival,
        0,  # Pre Arrival은 Code 0
        np.clip(flow_raw, 1, 4),  # 나머지는 1~4
    )
    
    # ⑤ 설명 매핑
    df["FLOW_DESCRIPTION"] = df["FLOW_CODE"].map(FLOW_CODES)
    
    return df


def calculate_final_location(df: pd.DataFrame) -> pd.DataFrame:
    """
    최종 위치 계산 (Status_Location 기반 또는 가장 최근 위치)
    참조: hvdc_excel_reporter_final_sqm_rev.py의 calculate_final_location
    """
    logger.info("최종 위치 계산 시작")
    df = df.copy()
    
    # Status_Location이 있으면 우선 사용
    if "Status_Location" in df.columns:
        df["Final_Location"] = df["Status_Location"].fillna("Unknown")
    else:
        # Status_Location이 없으면 가장 최근 위치로 계산
        df["Final_Location"] = "Unknown"
        
        # 모든 위치 컬럼 (창고 + MOSB + 현장)
        all_location_cols = WH_COLS + MOSB_COLS + SITE_COLS
        
        for idx, row in df.iterrows():
            valid_locations = []
            
            for location in all_location_cols:
                if location in row.index and pd.notna(row[location]):
                    try:
                        # 날짜 형식으로 변환 시도
                        location_date = pd.to_datetime(row[location], errors='coerce')
                        if pd.notna(location_date):
                            valid_locations.append((location, location_date))
                    except:
                        continue
            
            if valid_locations:
                # 가장 최근 날짜의 위치
                latest_location = max(valid_locations, key=lambda x: x[1])[0]
                df.at[idx, "Final_Location"] = latest_location
    
    logger.info("최종 위치 계산 완료")
    return df


def main():
    """메인 실행 함수"""
    # 파일 경로
    input_file = Path("supabass_ontol/hvdc_all_status.csv")
    output_dir = Path("supabass_ontol/flow_code_separated")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"CSV 파일 읽기: {input_file}")
    df = pd.read_csv(input_file, encoding="utf-8")
    
    logger.info(f"원본 데이터: {len(df)}건")
    
    # vendor 필터링 제거 (모든 vendor 포함)
    df_filtered = df.copy()
    logger.info(f"필터링 후 데이터: {len(df_filtered)}건 (모든 vendor 포함)")
    
    # Flow Code 계산
    logger.info("Flow Code 계산 시작")
    df_filtered = calculate_flow_code(df_filtered)
    
    # Final Location 계산
    df_filtered = calculate_final_location(df_filtered)
    
    # Flow Code 분포 출력
    flow_distribution = df_filtered["FLOW_CODE"].value_counts().sort_index()
    logger.info(f"Flow Code 분포: {dict(flow_distribution)}")
    
    # 엑셀 파일로 저장 (하나의 시트)
    output_excel = output_dir / "hvdc_all_status_with_flow_code.xlsx"
    with pd.ExcelWriter(output_excel, engine='openpyxl') as writer:
        df_filtered.to_excel(writer, sheet_name='HVDC_Status', index=False)
        logger.info(f"엑셀 파일 저장: {len(df_filtered)}건 → {output_excel}")
    
    logger.info("완료")


if __name__ == "__main__":
    main()
