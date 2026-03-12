/*
 * GET /api/worklist
 *
 * Dashboard Worklist API
 *
 * 이 엔드포인트는 shipments 테이블에서 원본 데이터를 가져온 후
 * 파생 계산을 통해 WorklistRow 배열과 KPI 요약을 생성합니다. 데이터 읽기
 * 에러가 발생하면 빈 배열과 기본 KPI 값을 반환하여 UI가 깨지는
 * 것을 방지합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import {
  shipmentToWorklistRow,
  calculateKpis,
  type ShipmentRow,
} from "@/lib/worklist-utils";
import type { DashboardPayload } from "@/types/worklist";

/**
 * fallback 데이터: API 호출 실패 시 빈 배열과 기본 KPI를 반환한다.
 */
const getFallbackPayload = (): DashboardPayload => ({
  lastRefreshAt: new Date().toISOString().replace("T", " ").slice(0, 16),
  kpis: {
    driAvg: 0.0,
    wsiAvg: 0.0,
    redCount: 0,
    overdueCount: 0,
    recoverableAED: 0.0,
    zeroStops: 0,
  },
  rows: [],
});

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];
    // Shipments 테이블 조회: 관련 필드와 연관된 warehouse_inventory를 함께 조회한다.
    const { data: shipments, error: shipmentsError } = await supabase
      .from("shipments")
      .select(
        `
        id,
        sct_ship_no,
        mr_number,
        commercial_invoice_no,
        invoice_date,
        vendor,
        main_description,
        port_of_loading,
        port_of_discharge,
        vessel_name,
        bl_awb_no,
        ship_mode,
        coe,
        etd,
        eta,
        do_collection_date,
        customs_start_date,
        customs_close_date,
        delivery_date,
        duty_amount_aed,
        vat_amount_aed,
        incoterms,
        warehouse_inventory (
          mosb,
          dsv_indoor,
          dsv_outdoor,
          dsv_mzd,
          jdn_mzd,
          jdn_waterfront,
          project_shu2,
          project_mir3,
          project_das4,
          project_agi5
        )
      `
      )
      .order("eta", { ascending: false, nullsLast: true });
    if (shipmentsError) {
      console.error("Supabase error:", shipmentsError);
      return NextResponse.json(getFallbackPayload());
    }
    // raw 데이터를 WorklistRow로 변환
    const worklistRows = (shipments || [])
      .map((s: any) => {
        try {
          const shipmentRow: ShipmentRow = {
            id: s.id,
            sct_ship_no: s.sct_ship_no,
            mr_number: s.mr_number,
            commercial_invoice_no: s.commercial_invoice_no,
            invoice_date: s.invoice_date,
            vendor: s.vendor,
            main_description: s.main_description,
            port_of_loading: s.port_of_loading,
            port_of_discharge: s.port_of_discharge,
            vessel_name: s.vessel_name,
            bl_awb_no: s.bl_awb_no,
            ship_mode: s.ship_mode,
            coe: s.coe,
            etd: s.etd,
            eta: s.eta,
            do_collection_date: s.do_collection_date,
            customs_start_date: s.customs_start_date,
            customs_close_date: s.customs_close_date,
            delivery_date: s.delivery_date,
            duty_amount_aed: s.duty_amount_aed ? Number(s.duty_amount_aed) : null,
            vat_amount_aed: s.vat_amount_aed ? Number(s.vat_amount_aed) : null,
            incoterms: s.incoterms,
            warehouse_inventory: s.warehouse_inventory
              ? {
                  mosb: s.warehouse_inventory.mosb,
                  dsv_indoor: s.warehouse_inventory.dsv_indoor,
                  dsv_outdoor: s.warehouse_inventory.dsv_outdoor,
                  dsv_mzd: s.warehouse_inventory.dsv_mzd,
                  jdn_mzd: s.warehouse_inventory.jdn_mzd,
                  jdn_waterfront: s.warehouse_inventory.jdn_waterfront,
                  project_shu2: s.warehouse_inventory.project_shu2,
                  project_mir3: s.warehouse_inventory.project_mir3,
                  project_das4: s.warehouse_inventory.project_das4,
                  project_agi5: s.warehouse_inventory.project_agi5,
                }
              : null,
          };
          return shipmentToWorklistRow(shipmentRow, today);
        } catch (err) {
          console.error(`Error converting shipment ${s.id}:`, err);
          return null;
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
    // KPI 계산
    const kpis = calculateKpis(worklistRows, today);
    // 페이로드 구성
    const payload: DashboardPayload = {
      lastRefreshAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      kpis,
      rows: worklistRows,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Worklist API error:", error);
    return NextResponse.json(getFallbackPayload());
  }
}