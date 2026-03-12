"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="hidden lg:block relative z-20">
                <Sidebar />
            </aside>

            <div className="flex flex-1 flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
