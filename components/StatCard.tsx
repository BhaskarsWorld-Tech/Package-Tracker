import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  accent: "indigo" | "blue" | "emerald" | "amber";
}) {
  const accents = {
    indigo: "bg-accent-50 text-accent-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon size={17} strokeWidth={2.25} />
        </div>
      </div>
      <div
        className={`mt-3 font-semibold tracking-tight text-neutral-900 ${
          typeof value === "string" && value.includes("·")
            ? "text-xl leading-tight"
            : "text-3xl"
        }`}
      >
        {value}
      </div>
    </Link>
  );
}
