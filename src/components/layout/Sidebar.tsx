"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  Car,
  Boxes,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { Role } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
  financeOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/orders", label: "Orders", icon: Package, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/drivers", label: "Drivers", icon: Truck, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/vehicles", label: "Vehicles", icon: Car, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/vendors", label: "Vendors", icon: Boxes, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/finance", label: "Finance", icon: Wallet, roles: ["ADMIN", "OPERATIONS"], financeOnly: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["ADMIN", "OPERATIONS"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({
  role,
  financeAccess,
  inDrawer = false,
}: {
  role: Role;
  financeAccess: boolean;
  // Rendered inside the mobile drawer: always visible, and the drawer supplies its own header.
  inDrawer?: boolean;
}) {
  const pathname = usePathname();

  const items = NAV.filter((item) => {
    if (!item.roles.includes(role)) return false;
    if (item.financeOnly && role !== "ADMIN" && !financeAccess) return false;
    return true;
  });

  return (
    <aside
      className={clsx(
        "shrink-0 flex-col bg-[var(--sidebar)] text-slate-300",
        inDrawer ? "flex flex-1" : "hidden w-60 md:flex"
      )}
    >
      {!inDrawer && (
        <div className="flex h-16 items-center gap-2 px-5">
          <Logo size={32} />
          <span className="text-sm font-semibold text-white">Simbi Logistics</span>
        </div>
      )}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-500">
        Simbi Logistics Platform<br />v1.0 — Phase 1 MVP
      </div>
    </aside>
  );
}
