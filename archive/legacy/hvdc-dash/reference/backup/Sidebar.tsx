"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  PackageSearch,
  FileText,
  BarChart2,
  Settings,
} from "lucide-react";

/**
 * Sidebar
 *
 * 메인 네비게이션 사이드바. 기본적으로 세 개의 메뉴를 제공하지만
 * 현재는 Dashboard만 활성화 상태로 표시됩니다. 향후 다른 페이지를
 * 추가할 수 있습니다.
 */
export function Sidebar() {
  const nav = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/shipments", label: "Shipments", icon: PackageSearch },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  return (
    <aside className="hidden md:flex flex-col w-48 bg-slate-800 text-white">
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        <span className="font-bold text-lg">HVDC Logi</span>
      </div>
      <nav className="flex-1 py-4">
        {nav.map((item, idx) => {
          const Icon = item.icon;
          // 단일 메뉴 활성화: 첫번째 항목만 활성화 (임시)
          const isActive = idx === 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700 ` +
                (isActive ? "bg-slate-700" : "")
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="py-4 px-4 border-t border-slate-700 text-xs text-slate-400">
        <p>Signed in as<br />User</p>
      </div>
    </aside>
  );
}