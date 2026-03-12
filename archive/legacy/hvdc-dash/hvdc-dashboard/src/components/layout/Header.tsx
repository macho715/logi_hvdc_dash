"use client";

import { Bell, Search, User } from "lucide-react";

export function Header() {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">Overview</h2>
                <span className="text-sm text-slate-400">/</span>
                <span className="text-sm text-slate-500">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search (Cmd+K)"
                        className="h-9 w-64 rounded-md border bg-slate-50 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium border border-slate-300">
                    <User className="h-5 w-5" />
                </div>
            </div>
        </header>
    );
}
