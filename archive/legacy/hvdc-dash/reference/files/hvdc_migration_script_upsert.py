"""
HVDC Excel to Supabase Migration Script
Samsung C&T HVDC Lightning Project
Author: Cha Minkyu
Date: 2025-01-08

이 스크립트는 HVDC_STATUS_1.xlsx 파일의 데이터를
Supabase PostgreSQL 데이터베이스로 마이그레이션합니다.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from supabase import create_client, Client
import os
from typing import Dict, Any, List
import logging
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HVDCDataMigrator:
    """HVDC 엑셀 데이터를 Supabase로 마이그레이션하는 클래스"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Args:
            supabase_url: Supabase 프로젝트 URL
            supabase_key: Supabase Service Role Key (서버 전용)
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.stats = {
            'total_rows': 0,
            'successful_shipments': 0,
            'successful_containers': 0,
            'successful_warehouses': 0,
            'errors': []
        }
    
    def read_excel(self, file_path: str) -> pd.DataFrame:
        """엑셀 파일 읽기"""
        logger.info(f"Reading Excel file: {file_path}")
        df = pd.read_excel(file_path, sheet_name='시트1')
        self.stats['total_rows'] = len(df)
        logger.info(f"Loaded {len(df)} rows")
        return df
    
    def clean_text(self, value: Any) -> Any:
        if pd.isna(value):
            return None
        return str(value).strip()

    def clean_decimal(self, value: Any) -> Any:
        if pd.isna(value):
            return None
        if isinstance(value, (pd.Timestamp, datetime)):
            return None # Should not be a date
        try:
            return float(value)
        except:
            return None

    def clean_int(self, value: Any) -> Any:
        if pd.isna(value):
            return None
        try:
            return int(float(value))
        except:
            return None

    def clean_date(self, value: Any) -> Any:
        if pd.isna(value):
            return None
        
        # Handle already datetime objects
        if isinstance(value, (pd.Timestamp, datetime)):
            return value.date().isoformat()
            
        # Handle Excel serial dates (float/int)
        if isinstance(value, (int, float, np.integer, np.floating)):
            try:
                # Excel base date is 1899-12-30
                return (datetime(1899, 12, 30) + pd.Timedelta(days=value)).date().isoformat()
            except:
                pass
        
        # Handle string dates if necessary (basic ISO check)
        val_str = str(value).strip()
        try:
            # Try parsing YYYY-MM-DD
            return datetime.strptime(val_str, '%Y-%m-%d').date().isoformat()
        except:
            pass
            
        return None
    
    def map_shipment_data(self, row: pd.Series) -> Dict[str, Any]:
        """
        엑셀 행을 shipments 테이블 구조로 매핑
        """
        return {
            'sct_ship_no': self.clean_text(row['SCT SHIP NO.']),
            'mr_number': self.clean_text(row['MR#']),
            'booking_order_date': self.clean_date(row['BOOKING ORDER DATE']),
            'sequence_no': self.clean_int(row['NO']),
            
            # 송장 정보
            'commercial_invoice_no': self.clean_text(row['COMMERCIAL INVOICE No.']),
            'invoice_date': self.clean_date(row['INVOICE Date']),
            'invoice_value': self.clean_decimal(row['INVOICE VALUE (A)']),
            'invoice_currency': self.clean_text(row['CURRENCY']),
            
            # 구매 정보
            'po_number': self.clean_text(row['PO No.']),
            'vendor': self.clean_text(row['VENDOR']),
            'category': self.clean_text(row['CATEGORY']),
            
            # 물품 설명
            'main_description': self.clean_text(row['MAIN DESCRIPTION (PO)']),
            'sub_description': self.clean_text(row['SUB DESCRIPTION']),
            
            # 프로젝트 분류
            'project_shu': row['SHU'] == 'O' if pd.notna(row['SHU']) else False,
            'project_das': row['DAS'] == 'O' if pd.notna(row['DAS']) else False,
            'project_mir': row['MIR'] == 'O' if pd.notna(row['MIR']) else False,
            'project_agi': row['AGI'] == 'O' if pd.notna(row['AGI']) else False,
            
            # 무역 조건
            'incoterms': self.clean_text(row['INCOTERMS']),
            
            # 금액 정보
            'freight_cost': self.clean_decimal(row['FREIGHT\n (B)']),
            'insurance_cost': self.clean_decimal(row['INSURANCE\n (C)']),
            'cif_value': self.clean_decimal(row['CIF VALUE\n (A+B+C)']),
            'coe': self.clean_text(row['COE']),
            
            # 항구 정보
            'port_of_loading': self.clean_text(row['POL']),
            'port_of_discharge': self.clean_text(row['POD']),
            
            # 선박/운송 정보
            'bl_awb_no': self.clean_text(row['B/L No./\n AWB No.']),
            'vessel_name': self.clean_text(row['VESSEL NAME/\n FLIGHT No.']),
            'vessel_imo_no': self.clean_text(row['VESSEL IMO NO.']),
            'shipping_line': self.clean_text(row['SHIPPING LINE']),
            'forwarder': self.clean_text(row['FORWARDER']),
            'ship_mode': self.clean_text(row['SHIP\n MODE']),
            
            # 중량 및 부피
            'package_qty': self.clean_int(row['PKG']),
            'gross_weight_kg': self.clean_decimal(row['GWT\n (KG)']),
            'cbm': self.clean_decimal(row['CBM']),
            'revenue_ton': self.clean_decimal(row['R/T\n (GRAND- TOTAL)']),
            'actual_weight_kg': self.clean_decimal(row['A_CWT(KG)']),
            
            # 일정
            'etd': self.clean_date(row['ETD']),
            'atd': self.clean_date(row['ATD']),
            'eta': self.clean_date(row['ETA']),
            'ata': self.clean_date(row['ATA']),
            
            # 증명 및 문서
            'attestation_date': self.clean_date(row['Attestation\n Date']),
            'do_collection_date': self.clean_date(row['DO Collection']),
            
            # 통관 정보
            'customs_start_date': self.clean_date(row['Customs\n Start']),
            'customs_close_date': self.clean_date(row['Customs\n Close']),
            'custom_code': self.clean_text(row['Custom\n Code']),
            'duty_amount_aed': self.clean_decimal(row['DUTY AMT\n (AED)']),
            'vat_amount_aed': self.clean_decimal(row['VAT AMT\n (AED)']),
            
            # 최종 배송
            'delivery_date': self.clean_date(row['DELIVERY DATE']),
            
            # 상태 결정
            'status': self._determine_status(row),
            
            # 메타데이터
            'created_at': datetime.now().isoformat(),
            'created_by': 'migration_script'
        }
    
    def map_container_data(self, row: pd.Series) -> Dict[str, Any]:
        """
        컨테이너 데이터 매핑
        """
        return {
            'qty_20dc': self.clean_int(row['20DC']),
            'qty_40dc': self.clean_int(row['40DC']),
            'qty_40hq': self.clean_int(row['40HQ']),
            'qty_45hq': self.clean_int(row['45HQ']),
            'qty_20ot_in': self.clean_int(row['20OT(IN)']),
            'qty_20ot_oh': self.clean_int(row['20OT(OH)']),
            'qty_40ot_in': self.clean_int(row['40OT(IN)']),
            'qty_40ot_oh': self.clean_int(row['40OT(OH)']),
            'qty_20fr_in': self.clean_int(row['20FR(IN)']),
            'qty_40fr_in': self.clean_int(row['40FR(IN)']),
            'qty_20fr_fv': self.clean_int(row['20FR(FV)']),
            'qty_40fr_ow': self.clean_int(row['40FR(OW)']),
            'qty_20fr_ow_oh': self.clean_int(row['20FR(OW,OH)']),
            'qty_40fr_ow_oh': self.clean_int(row['40FR(OW,OH)']),
            'qty_40fr_ow_ol': self.clean_int(row['40FR(OW,OL)']),
            'qty_lcl': self.clean_int(row['LCL']),
            'bulk_general': self.clean_int(row['G Bulk']),
            'bulk_open': self.clean_int(row['O Bulk']),
            'bulk_heavy': self.clean_int(row['H Bulk'])
        }
    
    def map_warehouse_data(self, row: pd.Series) -> Dict[str, Any]:
        """
        창고 재고 데이터 매핑
        """
        return {
            'project_shu2': self.clean_date(row['SHU2']),
            'project_mir3': self.clean_date(row['MIR3']),
            'project_das4': self.clean_date(row['DAS4']),
            'project_agi5': self.clean_date(row['AGI5']),
            'dsv_indoor': self.clean_date(row['DSV\n Indoor']),
            'dsv_outdoor': self.clean_date(row['DSV\n Outdoor']),
            'dsv_mzd': self.clean_date(row['DSV\n MZD']),
            'jdn_mzd': self.clean_date(row['JDN\n MZD']),
            'jdn_waterfront': self.clean_date(row['JDN\n Waterfront']),
            'mosb': self.clean_date(row['MOSB']),
            'aaa_storage': self.clean_date(row['AAA Storage']),
            'zener_wh': self.clean_date(row['ZENER (WH)']),
            'hauler_dg_storage': self.clean_date(row['Hauler DG Storage']),
            'vijay_tanks': self.clean_date(row['Vijay Tanks'])
        }
    
    def _determine_status(self, row: pd.Series) -> str:
        """
        행 데이터를 기반으로 선적 상태 결정
        """
        if pd.notna(row['DELIVERY DATE']):
            return 'delivered'
        elif pd.notna(row['ATA']):
            return 'arrived'
        elif pd.notna(row['ATD']):
            return 'in_transit'
        elif pd.notna(row['ETD']):
            return 'scheduled'
        else:
            return 'pending'
    
    def migrate_row(self, row: pd.Series, row_index: int) -> bool:
        """
        단일 행 마이그레이션
        
        Returns:
            bool: 성공 여부
        """
        try:
            # 1. Shipment 데이터 삽입
            shipment_data = self.map_shipment_data(row)
            
            # SCT SHIP NO가 없으면 스킵
            if not shipment_data['sct_ship_no']:
                logger.warning(f"Row {row_index}: No SCT SHIP NO, skipping")
                return False
            
            # UPSERT: 존재하면 업데이트, 없으면 삽입
            shipment_response = self.supabase.table('shipments').upsert(
                shipment_data,
                on_conflict='sct_ship_no'
            ).execute()
            
            if not shipment_response.data:
                raise Exception("Shipment upsert failed")
            
            shipment_id = shipment_response.data[0]['id']
            self.stats['successful_shipments'] += 1
            
            # 2. Container 데이터 UPSERT
            container_data = self.map_container_data(row)
            container_data['shipment_id'] = shipment_id
            
            # 기존 container 삭제 후 재삽입 (shipment_id로 연결)
            self.supabase.table('container_details').delete().eq('shipment_id', shipment_id).execute()
            container_response = self.supabase.table('container_details').insert(container_data).execute()
            if container_response.data:
                self.stats['successful_containers'] += 1
            
            # 3. Warehouse 데이터 UPSERT
            warehouse_data = self.map_warehouse_data(row)
            warehouse_data['shipment_id'] = shipment_id
            
            # 기존 warehouse 삭제 후 재삽입
            self.supabase.table('warehouse_inventory').delete().eq('shipment_id', shipment_id).execute()
            warehouse_response = self.supabase.table('warehouse_inventory').insert(warehouse_data).execute()
            if warehouse_response.data:
                self.stats['successful_warehouses'] += 1
            
            logger.info(f"Row {row_index}: Successfully migrated {shipment_data['sct_ship_no']}")
            return True
            
        except Exception as e:
            error_msg = f"Row {row_index}: {str(e)}"
            logger.error(error_msg)
            self.stats['errors'].append(error_msg)
            return False
    
    def migrate_all(self, df: pd.DataFrame, batch_size: int = 10):
        """
        전체 데이터 마이그레이션
        
        Args:
            df: 마이그레이션할 DataFrame
            batch_size: 배치 크기 (진행 상황 표시용)
        """
        logger.info(f"Starting migration of {len(df)} rows")
        
        for idx, row in df.iterrows():
            self.migrate_row(row, idx + 1)
            
            # 배치마다 진행 상황 출력
            if (idx + 1) % batch_size == 0:
                logger.info(f"Progress: {idx + 1}/{len(df)} rows processed")
        
        # 최종 통계
        self.print_statistics()
    
    def print_statistics(self):
        """마이그레이션 통계 출력"""
        logger.info("\n" + "="*60)
        logger.info("MIGRATION STATISTICS")
        logger.info("="*60)
        logger.info(f"Total rows processed: {self.stats['total_rows']}")
        logger.info(f"Successful shipments: {self.stats['successful_shipments']}")
        logger.info(f"Successful containers: {self.stats['successful_containers']}")
        logger.info(f"Successful warehouses: {self.stats['successful_warehouses']}")
        logger.info(f"Errors: {len(self.stats['errors'])}")
        
        if self.stats['errors']:
            logger.info("\nError details:")
            for error in self.stats['errors'][:10]:  # 첫 10개 에러만 표시
                logger.info(f"  - {error}")
            if len(self.stats['errors']) > 10:
                logger.info(f"  ... and {len(self.stats['errors']) - 10} more errors")
        
        logger.info("="*60)


def main():
    """메인 실행 함수"""
    
    # 환경 변수에서 Supabase 설정 읽기
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        return
    
    # 엑셀 파일 경로
    # 엑셀 파일 경로
    EXCEL_FILE = r'C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard\HVDC STATUS_1.xlsx'
    
    if not os.path.exists(EXCEL_FILE):
        logger.error(f"Excel file not found: {EXCEL_FILE}")
        return
    
    # 마이그레이터 생성
    migrator = HVDCDataMigrator(SUPABASE_URL, SUPABASE_KEY)
    
    # 데이터 읽기
    df = migrator.read_excel(EXCEL_FILE)
    
    # 마이그레이션 실행
    migrator.migrate_all(df, batch_size=10)
    
    logger.info("Migration completed!")


if __name__ == "__main__":
    main()
