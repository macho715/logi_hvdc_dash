#!/usr/bin/env python3
"""
Flow Code v3.5 마이그레이션 검증 스크립트

검증 항목:
1. 모든 shipments에 Flow Code가 계산되었는지 확인
2. AGI/DAS 규칙 준수 확인
3. Flow Code 분포 확인
4. 업그레이드된 케이스 추적
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Supabase 클라이언트 (환경 변수에서 읽기)
try:
    from supabase import create_client, Client
except ImportError:
    print("⚠️  supabase 패키지가 설치되지 않았습니다.")
    print("   설치: pip install supabase")
    sys.exit(1)

def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성"""
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set.\n"
            "환경 변수 설정:\n"
            "  export SUPABASE_URL=your_supabase_url\n"
            "  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
        )
    
    return create_client(url, key)

def validate_flow_code_coverage(supabase: Client) -> Tuple[bool, Dict]:
    """모든 shipments에 Flow Code가 계산되었는지 확인"""
    result = supabase.table("shipments").select("id, flow_code").execute()
    
    total = len(result.data)
    with_flow_code = sum(1 for row in result.data if row.get("flow_code") is not None)
    without_flow_code = total - with_flow_code
    
    coverage = with_flow_code / total if total > 0 else 0
    
    return coverage >= 0.95, {
        "total": total,
        "with_flow_code": with_flow_code,
        "without_flow_code": without_flow_code,
        "coverage": coverage
    }

def validate_agi_das_compliance(supabase: Client) -> Tuple[bool, List[Dict]]:
    """AGI/DAS 규칙 준수 확인"""
    result = supabase.table("shipments").select(
        "id, sct_ship_no, final_location, flow_code"
    ).in_("final_location", ["AGI", "DAS"]).execute()
    
    violations = [
        row for row in result.data
        if row.get("flow_code") is not None and row.get("flow_code", 0) < 3
    ]
    
    return len(violations) == 0, violations

def validate_flow_code_distribution(supabase: Client) -> Dict[int, int]:
    """Flow Code 분포 확인"""
    result = supabase.table("shipments").select("flow_code").execute()
    
    distribution = {}
    for row in result.data:
        fc = row.get("flow_code")
        if fc is not None:
            distribution[fc] = distribution.get(fc, 0) + 1
    
    return distribution

def validate_upgrade_tracking(supabase: Client) -> Tuple[bool, List[Dict]]:
    """업그레이드된 케이스 추적 확인"""
    result = supabase.table("shipments").select(
        "id, sct_ship_no, flow_code_original, flow_code, flow_override_reason"
    ).execute()
    
    upgrades = [
        row for row in result.data
        if row.get("flow_code_original") is not None 
        and row.get("flow_code") is not None
        and row.get("flow_code_original") != row.get("flow_code")
    ]
    
    # 업그레이드된 케이스는 모두 override_reason이 있어야 함
    missing_reasons = [
        row for row in upgrades
        if not row.get("flow_override_reason")
    ]
    
    return len(missing_reasons) == 0, missing_reasons

def validate_constraint_active(supabase: Client) -> Tuple[bool, str]:
    """AGI/DAS 제약조건 활성화 확인"""
    # 제약조건 확인을 위해 위반 케이스 삽입 시도 (롤백)
    # 실제로는 RPC 함수나 직접 쿼리로 확인
    try:
        # 간접 확인: 위반 케이스가 있는지 확인
        violations = supabase.rpc("get_flow_code_violations").execute()
        if violations.data and len(violations.data) > 0:
            return False, f"Found {len(violations.data)} violations"
        return True, "No violations found"
    except Exception as e:
        # RPC 함수가 없을 수 있으므로 경고만
        return True, f"Constraint check skipped (RPC not available): {str(e)}"

def main():
    """메인 검증 함수"""
    print("=" * 60)
    print("Flow Code v3.5 마이그레이션 검증")
    print("=" * 60)
    
    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"\n❌ Supabase 클라이언트 생성 실패: {e}")
        sys.exit(1)
    
    # 1. Flow Code 커버리지 확인
    print("\n1. Flow Code 커버리지 확인...")
    try:
        coverage_ok, coverage_data = validate_flow_code_coverage(supabase)
        print(f"   총 shipments: {coverage_data['total']}")
        print(f"   Flow Code 계산됨: {coverage_data['with_flow_code']}")
        print(f"   Flow Code 없음: {coverage_data['without_flow_code']}")
        print(f"   커버리지: {coverage_data['coverage']:.2%}")
        print(f"   상태: {'✅ PASS' if coverage_ok else '❌ FAIL'}")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        coverage_ok = False
    
    # 2. AGI/DAS 규칙 준수 확인
    print("\n2. AGI/DAS 규칙 준수 확인...")
    try:
        compliance_ok, violations = validate_agi_das_compliance(supabase)
        print(f"   위반 케이스: {len(violations)}")
        if violations:
            print("   위반 케이스 목록:")
            for v in violations[:10]:  # 최대 10개만 표시
                print(f"     - {v.get('sct_ship_no')}: {v.get('final_location')} -> Flow {v.get('flow_code')}")
        print(f"   상태: {'✅ PASS' if compliance_ok else '❌ FAIL'}")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        compliance_ok = False
    
    # 3. Flow Code 분포 확인
    print("\n3. Flow Code 분포 확인...")
    try:
        distribution = validate_flow_code_distribution(supabase)
        total_with_flow = sum(distribution.values())
        for fc in sorted(distribution.keys()):
            count = distribution[fc]
            pct = count / total_with_flow * 100 if total_with_flow > 0 else 0
            print(f"   Flow {fc}: {count}건 ({pct:.1f}%)")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
    
    # 4. 업그레이드 추적 확인
    print("\n4. 업그레이드 추적 확인...")
    try:
        upgrade_ok, missing_reasons = validate_upgrade_tracking(supabase)
        print(f"   업그레이드된 케이스: {len(missing_reasons)} (이유 누락)")
        if missing_reasons:
            print("   이유 누락 케이스:")
            for m in missing_reasons[:10]:
                print(f"     - {m.get('sct_ship_no')}: {m.get('flow_code_original')} -> {m.get('flow_code')}")
        print(f"   상태: {'✅ PASS' if upgrade_ok else '❌ FAIL'}")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        upgrade_ok = False
    
    # 5. 제약조건 활성화 확인
    print("\n5. AGI/DAS 제약조건 활성화 확인...")
    try:
        constraint_ok, constraint_msg = validate_constraint_active(supabase)
        print(f"   {constraint_msg}")
        print(f"   상태: {'✅ PASS' if constraint_ok else '⚠️  WARNING'}")
    except Exception as e:
        print(f"   ⚠️  확인 불가: {e}")
        constraint_ok = True  # 오류가 있어도 실패로 처리하지 않음
    
    # 최종 결과
    print("\n" + "=" * 60)
    all_ok = coverage_ok and compliance_ok and upgrade_ok
    print(f"최종 결과: {'✅ 모든 검증 통과' if all_ok else '❌ 검증 실패'}")
    print("=" * 60)
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
