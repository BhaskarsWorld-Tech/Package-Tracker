"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, CreditCard, Truck, Ship } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/courier-payments", label: "Courier Payments", icon: Truck },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-20 bg-white border-b border-neutral-200/80">
      <div className="flex items-center gap-2 px-4 h-14">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 text-white">
          <Ship size={15} strokeWidth={2.25} />
        </div>
        <span className="font-semibold text-neutral-900 text-sm">Package Tracker</span>
      </div>
      <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-50 text-accent-700"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              <Icon size={15} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
