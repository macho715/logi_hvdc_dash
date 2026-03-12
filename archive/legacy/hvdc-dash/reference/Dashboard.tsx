/*
 * Dashboard.tsx
 *
 * This component implements the new "Premium Dashboard" for the HVDC
 * logistics application. It replaces the previous simple card layout
 * with a bento‑style grid that includes a high performance SVG world
 * map, animated pulse markers for delayed shipments, sparkline charts
 * for trend visualisation and a compact status breakdown. The design
 * emphasises minimal dependencies and leverages Tailwind CSS for
 * styling. An SVG map is embedded directly to avoid loading heavy
 * mapping libraries; this approach is inspired by projects such as
 * react‑svg‑worldmap which provide lightweight world maps without
 * network calls【259665994263113†L329-L352】 and by simplemaps.com,
 * where the world SVG is optimised for fast rendering【260981710289470†L44-L55】.
 *
 * The dashboard fetches shipment statistics from `/api/statistics` and
 * expects the API to return an object with the following shape:
 * {
 *   overview: {
 *     total_shipments: number,
 *     in_transit_shipments: number,
 *     arrived_shipments: number,
 *     delivered_shipments: number,
 *     delayed_shipments: number,
 *     total_containers: number,
 *     total_weight_kg: number,
 *     total_cbm: number,
 *     // ... other summary metrics
 *   },
 *   status_breakdown: Record<string, number>,
 *   delayed_shipments: Array<{ latitude: number, longitude: number, sct_ship_no: string, days_delayed: number }>,
 *   trends?: {
 *     total_shipments?: number[],
 *     in_transit?: number[],
 *     delivered?: number[],
 *     delayed?: number[]
 *   }
 * }
 *
 * If the API does not provide `trends`, simple fallbacks (flat lines)
 * are used. The component is written to degrade gracefully: missing
 * values will not break the UI. See the implementation guide for more
 * information on the expected API endpoints.
 */

"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Globe,
  TrendingUp,
} from "lucide-react";
import Sparkline from "./Sparkline";

interface Overview {
  total_shipments: number;
  in_transit_shipments: number;
  arrived_shipments: number;
  delivered_shipments: number;
  delayed_shipments: number;
  total_containers: number;
  total_weight_kg: number;
  total_cbm: number;
  [key: string]: number;
}

interface Shipment {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  sct_ship_no?: string;
  days_delayed?: number;
  [key: string]: any;
}

interface DashboardStats {
  overview: Overview;
  status_breakdown: Record<string, number>;
  delayed_shipments: Shipment[];
  trends?: {
    total_shipments?: number[];
    in_transit?: number[];
    delivered?: number[];
    delayed?: number[];
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/statistics");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard statistics", err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  // Loading state: centre spinner and message
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!stats) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load statistics. Please refresh.
      </div>
    );
  }

  const { overview, status_breakdown, delayed_shipments, trends } = stats;

  // Provide fallbacks for trend data if not present
  const fallbackTrend = (value: number) => Array(8).fill(value);
  const trendTotal = trends?.total_shipments ?? fallbackTrend(overview.total_shipments);
  const trendTransit = trends?.in_transit ?? fallbackTrend(overview.in_transit_shipments);
  const trendDelivered = trends?.delivered ?? fallbackTrend(overview.delivered_shipments);
  const trendDelayed = trends?.delayed ?? fallbackTrend(overview.delayed_shipments);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">HVDC Logistics Dashboard</h1>
        <p className="text-sm text-gray-600">Real‑time overview of shipments and statuses</p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
        {/* Card: Total Shipments */}
        <StatsCard
          title="Total Shipments"
          value={overview.total_shipments}
          icon={<Package className="h-5 w-5 text-blue-500" />}
          trend={trendTotal}
          colour="text-blue-600"
        />
        {/* Card: In Transit */}
        <StatsCard
          title="In Transit"
          value={overview.in_transit_shipments}
          icon={<Truck className="h-5 w-5 text-yellow-500" />}
          trend={trendTransit}
          colour="text-yellow-600"
        />
        {/* Card: Delivered */}
        <StatsCard
          title="Delivered"
          value={overview.delivered_shipments}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          trend={trendDelivered}
          colour="text-green-600"
        />
        {/* Card: Delayed */}
        <StatsCard
          title="Delayed"
          value={overview.delayed_shipments}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          trend={trendDelayed}
          colour="text-red-600"
        />

        {/* World map with pulses – spans 7 columns and 2 rows on large screens */}
        <div className="col-span-12 lg:col-span-7 row-span-2 bg-white rounded-lg shadow p-4 relative overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 flex items-center mb-2">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            Delayed Shipments
          </h2>
          {/* Map container: relative positioning for pulses */}
          <div className="relative w-full h-full">
            {/* Embed the static world SVG. Use object-cover to maintain aspect ratio */}
            <img
              src="/world.svg"
              alt="World map"
              className="w-full h-full object-contain opacity-80"
            />
            {/* Overlay pulses for each delayed shipment */}
            {delayed_shipments?.map((ship, idx) => {
              // Determine coordinates; support multiple property names
              const lat = ship.latitude ?? ship.lat ?? null;
              const lon = ship.longitude ?? ship.lng ?? null;
              if (lat == null || lon == null) return null;
              // Convert to percentage positions; equirectangular projection
              const x = ((lon + 180) / 360) * 100;
              const y = ((90 - lat) / 180) * 100;
              return (
                <div
                  key={idx}
                  className="absolute pointer-events-none"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Ping animation */}
                  <span className="absolute -left-2 -top-2 inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  {/* Dot */}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
                </div>
              );
            })}
          </div>
          {/* When there are no delayed shipments */}
          {(!delayed_shipments || delayed_shipments.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-gray-500">No delayed shipments 🎉</p>
            </div>
          )}
        </div>

        {/* Status breakdown – spans 5 columns and 2 rows on large screens */}
        <div className="col-span-12 lg:col-span-5 row-span-2 bg-white rounded-lg shadow p-4 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 flex items-center mb-2">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Status Breakdown
          </h2>
          <div className="flex-1 overflow-y-auto">
            {Object.entries(status_breakdown).map(([status, count]) => {
              const percentage = overview.total_shipments
                ? ((count / overview.total_shipments) * 100).toFixed(1)
                : "0.0";
              return (
                <div key={status} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-0.5">
                    {percentage}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delayed shipments list – spans full width */}
        <div className="col-span-12 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Delayed Shipment Details
          </h2>
          {delayed_shipments && delayed_shipments.length > 0 ? (
            <div className="max-h-48 overflow-y-auto divide-y divide-gray-200">
              {delayed_shipments.map((ship, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <span className="font-mono text-gray-800 mr-2">
                      {ship.sct_ship_no ?? "N/A"}
                    </span>
                    <span className="text-gray-500">
                      {ship.days_delayed ? `${ship.days_delayed} days` : "Delay"}
                    </span>
                  </div>
                  {/* Optionally link or action could go here */}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No delayed shipments!</p>
          )}
        </div>
      </div>

      {/* Footer / last updated */}
      <div className="mt-6 text-sm text-gray-500 text-right">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

// StatsCard component for showing a metric, icon and sparkline
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: number[];
  colour?: string;
}

function StatsCard({ title, value, icon, trend, colour }: StatsCardProps) {
  // Apply the colour class to the card so that nested elements
  // (including the sparkline) inherit the text colour via currentColor.
  const cardColour = colour ?? "text-blue-600";
  return (
    <div className={`col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-lg shadow p-4 flex flex-col justify-between ${cardColour}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-gray-700">
          {icon}
          <span className="ml-2 text-sm font-medium capitalize">{title}</span>
        </div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
      </div>
      {/* Sparkline chart for trends */}
      <Sparkline data={trend} />
    </div>
  );
}