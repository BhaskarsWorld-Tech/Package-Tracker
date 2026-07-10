"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, CreditCard, Ship } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-neutral-200/80 bg-white">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-neutral-200/80">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-sm shadow-accent-500/30">
          <Ship size={17} strokeWidth={2.25} />
        </div>
        <span className="font-semibold text-neutral-900 tracking-tight">
          Package Tracker
        </span>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-50 text-accent-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={2}
                className={active ? "text-accent-600" : "text-neutral-400 group-hover:text-neutral-600"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-neutral-200/80">
        <p className="text-xs text-neutral-400">India ⇄ USA shipments</p>
      </div>
    </aside>
  );
}
