"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * DashboardLayout
 *
 * 대시보드 페이지의 기본 레이아웃을 제공합니다. 왼쪽 사이드바와 상단 헤더를
 * 포함하며, 메인 영역에 children을 렌더링합니다.
 */
export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}