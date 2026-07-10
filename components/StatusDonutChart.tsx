"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

export type DonutDatum = { name: string; value: number; color: string };

export default function StatusDonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 text-neutral-300">
        <PieChartIcon size={28} />
        <p className="text-sm text-neutral-400">No shipments yet.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero.length ? nonZero : [{ name: "None", value: 1, color: "#e5e7eb" }]}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={nonZero.length > 1 ? 3 : 0}
              stroke="none"
            >
              {(nonZero.length ? nonZero : [{ name: "None", value: 1, color: "#e5e7eb" }]).map(
                (d, i) => (
                  <Cell key={i} fill={d.color} />
                )
              )}
            </Pie>
            {nonZero.length > 0 && (
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-neutral-900">{total}</span>
          <span className="text-xs text-neutral-400">Total</span>
        </div>
      </div>
      <ul className="space-y-2.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-neutral-600">{d.name}</span>
            <span className="ml-auto pl-4 font-medium text-neutral-900">
              {d.value}
              <span className="ml-1 text-xs font-normal text-neutral-400">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
