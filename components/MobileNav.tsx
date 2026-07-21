"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Truck,
  Ship,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "@/lib/useCurrentUser";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/courier-payments", label: "Courier Payments", icon: Truck },
];

const ADMIN_NAV = [{ href: "/users", label: "Users", icon: ShieldCheck }];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useCurrentUser();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden sticky top-0 z-20 bg-white border-b border-neutral-200/80">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 text-white">
            <Ship size={15} strokeWidth={2.25} />
          </div>
          <span className="font-semibold text-neutral-900 text-sm">Package Tracker</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
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
        {isAdmin &&
          ADMIN_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
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
