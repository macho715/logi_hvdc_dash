from __future__ import annotations

import os
from typing import Any

import pytest

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover
    Client = Any  # type: ignore[assignment]
    create_client = None  # type: ignore[assignment]
    SUPABASE_AVAILABLE = False
else:
    SUPABASE_AVAILABLE = True


def _make_client(key: str) -> Client:
    """Create a Supabase client for the given key or skip if unavailable."""
    if not SUPABASE_AVAILABLE:
        pytest.skip("supabase client library is not installed")

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    if not url or not key:
        pytest.skip("Supabase RLS test requires URL and keys in environment")

    return create_client(url, key)  # type: ignore[call-arg]


@pytest.mark.integration
def test_rls_policies_enforced() -> None:
    """Verify anon vs service-role behavior for Supabase RLS."""
    anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not anon_key or not service_key:
        pytest.skip("Supabase RLS test requires anon and service role keys")

    supabase_anon = _make_client(anon_key)
    supabase_service = _make_client(service_key)

    # 0) anon read should be allowed on permitted, non-sensitive tables (hvdc_kpis)
    read_response = supabase_anon.table("hvdc_kpis").select("id").limit(1).execute()
    read_error = getattr(read_response, "error", None)
    assert read_error is None, f"anon read on hvdc_kpis should be allowed, got: {read_error}"

    # 1) anon must NOT be able to write to core tables (shipments)
    test_sct_ship_no = "RLSTEST-" + os.urandom(8).hex()
    insert_payload = {
        "sct_ship_no": test_sct_ship_no,
        "vendor": "RLSTEST",
    }

    anon_write_blocked = False
    try:
        anon_insert_response = (
            supabase_anon.table("shipments").insert(insert_payload).execute()
        )
    except Exception:
        anon_write_blocked = True
    else:
        anon_insert_error = getattr(anon_insert_response, "error", None)
        anon_write_blocked = anon_insert_error is not None

    assert anon_write_blocked, "anon should not be able to insert into shipments"

    # 2) service role CAN perform the same write (server/batch only)
    service_insert_response = (
        supabase_service.table("shipments").insert(insert_payload).execute()
    )
    service_insert_error = getattr(service_insert_response, "error", None)
    assert (
        service_insert_error is None
    ), f"service role insert into shipments failed: {service_insert_error}"

    # 3) cleanup (best-effort; test behavior already asserted)
    try:
        supabase_service.table("shipments").delete().eq(
            "sct_ship_no",
            test_sct_ship_no,
        ).execute()
    except Exception:
        # Cleanup failures should not mask RLS behavior
        pytest.skip("Cleanup of test shipment failed; check Supabase logs if persistent")

