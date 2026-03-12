"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, BarChart3, Settings, LogOut, Truck, FileText } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/shipments", label: "Shipments", icon: Truck },
        { href: "/documents", label: "Documents", icon: FileText },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <span>HVDC Logi</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
