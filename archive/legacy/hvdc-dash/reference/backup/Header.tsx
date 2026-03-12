"use client";

import { Bell, UserCircle } from "lucide-react";

/**
 * Header
 *
 * 상단 헤더 바. 페이지 타이틀과 사용자/알림 아이콘을 표시합니다. 추가적인
 * 검색 입력이나 명령 팔레트는 추후 추가될 수 있습니다.
 */
export function Header() {
  return (
    <header className="h-16 px-4 flex items-center justify-between border-b bg-white">
      <div className="text-lg font-semibold">Dashboard</div>
      <div className="flex items-center gap-3">
        <button className="p-1 rounded-md hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>
        <button className="p-1 rounded-md hover:bg-gray-100">
          <UserCircle className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </header>
  );
}