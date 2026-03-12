#!/usr/bin/env python3
"""
HVDC JSON → TTL 변환 시 사용된 컬럼 검증 스크립트
컬럼 스펙(SSOT)과 실제 사용 컬럼을 비교하여 정합성 확인
"""

import json
import sys
from pathlib import Path
from typing import Dict, Set


def load_column_spec(spec_path: Path) -> Dict:
    """컬럼 스펙 JSON 로드"""
    with open(spec_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_used_columns(ttl_content: str) -> Set[str]:
    """TTL 파일에서 사용된 컬럼명 추출 (예시)"""
    # 실제 구현은 TTL 파싱 로직에 따라 다름
    used = set()
    # 예시: logi:hasStatus 같은 property에서 역매핑
    # 실제로는 더 정교한 파싱 필요
    return used


def validate_columns(spec: Dict, used: Set[str]) -> tuple[bool, list]:
    """컬럼 사용 검증"""
    spec_columns = set(spec.get('columns', {}).keys())
    missing = used - spec_columns
    unused_required = {
        col for col, meta in spec.get('columns', {}).items()
        if meta.get('required', False) and col not in used
    }
    
    errors = []
    if missing:
        errors.append(f"사용되었으나 스펙에 없는 컬럼: {missing}")
    if unused_required:
        errors.append(f"필수 컬럼이 사용되지 않음: {unused_required}")
    
    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 3:
        print("Usage: validate_used_cols.py <spec.json> <output.ttl>")
        sys.exit(1)
    
    spec_path = Path(sys.argv[1])
    ttl_path = Path(sys.argv[2])
    
    spec = load_column_spec(spec_path)
    ttl_content = ttl_path.read_text(encoding='utf-8')
    used = extract_used_columns(ttl_content)
    
    valid, errors = validate_columns(spec, used)
    
    if valid:
        print("✓ 모든 컬럼 검증 통과")
        sys.exit(0)
    else:
        print("✗ 검증 실패:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)


if __name__ == '__main__':
    main()
