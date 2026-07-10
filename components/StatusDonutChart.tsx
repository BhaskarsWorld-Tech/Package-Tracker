"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DonutDatum = { name: string; value: number; color: string };

export default function StatusDonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);
  const ringData = nonZero.length
    ? nonZero
    : [{ name: "None", value: 1, color: "#e5e7eb" }];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ringData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={74}
              paddingAngle={nonZero.length > 1 ? 3 : 0}
              stroke="none"
            >
              {ringData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
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
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-neutral-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.name}
            </span>
            <span className="shrink-0 font-medium text-neutral-900">
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
