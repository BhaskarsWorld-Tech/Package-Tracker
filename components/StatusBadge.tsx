const COLORS: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Quoted: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Lost: "bg-neutral-100 text-neutral-500 ring-neutral-500/10",
  "Pending Pickup": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "In Transit": "bg-blue-50 text-blue-700 ring-blue-600/20",
  Customs: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Partial: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Refunded: "bg-neutral-100 text-neutral-500 ring-neutral-500/10",
};

const DOT: Record<string, string> = {
  New: "bg-blue-500",
  Contacted: "bg-amber-500",
  Quoted: "bg-violet-500",
  Converted: "bg-emerald-500",
  Lost: "bg-neutral-400",
  "Pending Pickup": "bg-amber-500",
  "In Transit": "bg-blue-500",
  Customs: "bg-orange-500",
  Delivered: "bg-emerald-500",
  Pending: "bg-amber-500",
  Paid: "bg-emerald-500",
  Partial: "bg-orange-500",
  Refunded: "bg-neutral-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? "bg-neutral-100 text-neutral-600 ring-neutral-500/10";
  const dot = DOT[status] ?? "bg-neutral-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
