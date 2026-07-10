"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ship,
  PackageCheck,
  Wallet,
  ArrowRight,
  Phone,
  Mail,
  TrendingUp,
  Truck,
} from "lucide-react";
import type { Lead, Package, Payment } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import StatusDonutChart from "@/components/StatusDonutChart";
import { formatMoney, sumByCurrency, formatCurrencyTotals } from "@/lib/money";
import { timeAgo, shortDate } from "@/lib/date";

const STATUS_COLORS: Record<string, string> = {
  "Pending Pickup": "#f59e0b",
  "In Transit": "#3b82f6",
  Customs: "#f97316",
  Delivered: "#10b981",
};

const LEAD_TABS = ["All", "New", "Contacted", "Quoted", "Converted"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadTab, setLeadTab] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const [l, p, pay] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/packages"),
          fetch("/api/payments"),
        ]);
        const [leadsData, packagesData, paymentsData] = await Promise.all([
          l.json(),
          p.json(),
          pay.json(),
        ]);
        if (!l.ok || !p.ok || !pay.ok) {
          const first = [leadsData, packagesData, paymentsData].find(
            (d) => d?.error
          );
          throw new Error(first?.error ?? "One or more requests failed");
        }
        setLeads(leadsData);
        setPackages(packagesData);
        setPayments(paymentsData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const delivered = packages.filter((p) => p.status === "Delivered");
  const inTransit = packages.filter(
    (p) => p.status === "In Transit" || p.status === "Customs"
  );
  const customs = packages.filter((p) => p.status === "Customs");
  const deliverySuccess =
    packages.length > 0
      ? Math.round((delivered.length / packages.length) * 100)
      : 0;

  const remainingBalances = packages
    .filter((pkg) => pkg.amountDue)
    .map((pkg) => {
      const due = parseFloat(pkg.amountDue) || 0;
      const paid = payments
        .filter((p) => p.packageId === pkg.id && p.currency === pkg.currency)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      return { amount: String(Math.max(due - paid, 0)), currency: pkg.currency };
    })
    .filter((b) => parseFloat(b.amount) > 0);
  const outstandingTotals = sumByCurrency(remainingBalances);

  const statusDonutData = useMemo(
    () =>
      ["Pending Pickup", "In Transit", "Customs", "Delivered"].map((s) => ({
        name: s,
        value: packages.filter((p) => p.status === s).length,
        color: STATUS_COLORS[s],
      })),
    [packages]
  );

  const shipmentsOverTime = useMemo(() => {
    const byDate = new Map<string, number>();
    packages
      .filter((p) => p.shippedDate)
      .forEach((p) => {
        byDate.set(p.shippedDate, (byDate.get(p.shippedDate) ?? 0) + 1);
      });
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ label: shortDate(date), value: count }));
  }, [packages]);

  const carrierStats = useMemo(() => {
    const byCarrier = new Map<string, Package[]>();
    packages
      .filter((p) => p.carrier.trim())
      .forEach((p) => {
        const key = p.carrier.trim();
        byCarrier.set(key, [...(byCarrier.get(key) ?? []), p]);
      });
    return [...byCarrier.entries()]
      .map(([carrier, pkgs]) => {
        const deliveredCount = pkgs.filter((p) => p.status === "Delivered").length;
        const transitCount = pkgs.filter(
          (p) => p.status === "In Transit" || p.status === "Customs"
        ).length;
        return {
          carrier,
          delivered: deliveredCount,
          inTransit: transitCount,
          total: pkgs.length,
          successRate:
            pkgs.length > 0 ? Math.round((deliveredCount / pkgs.length) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [packages]);

  const filteredLeads = useMemo(
    () =>
      leadTab === "All" ? leads : leads.filter((l) => l.status === leadTab),
    [leads, leadTab]
  );

  const paidPayments = useMemo(
    () => payments.filter((p) => p.status === "Paid"),
    [payments]
  );
  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === "Pending" || p.status === "Partial"),
    [payments]
  );
  const totalRevenueTotals = sumByCurrency(paidPayments);
  const pendingTotals = sumByCurrency(pendingPayments);

  const primaryCurrency = useMemo(() => {
    const counts = sumByCurrency(payments.map((p) => ({ ...p, amount: "1" })));
    const entries = Object.entries(counts);
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
  }, [payments]);

  const revenueTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    paidPayments
      .filter((p) => p.currency === primaryCurrency)
      .forEach((p) => {
        byDate.set(p.date, (byDate.get(p.date) ?? 0) + (parseFloat(p.amount) || 0));
      });
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ label: shortDate(date), value: amount }));
  }, [paidPayments, primaryCurrency]);

  const recentPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [payments]
  );

  if (error) {
    return <ErrorBanner message={error} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of your India ⇄ USA shipping operation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Packages"
          value={loading ? "—" : packages.length}
          href="/packages"
          icon={PackageCheck}
          accent="emerald"
        />
        <StatCard
          label="In Transit"
          value={loading ? "—" : inTransit.length}
          href="/packages"
          icon={Ship}
          accent="blue"
        />
        <StatCard
          label="Delivered"
          value={loading ? "—" : delivered.length}
          href="/packages"
          icon={PackageCheck}
          accent="emerald"
        />
        <StatCard
          label="In Customs"
          value={loading ? "—" : customs.length}
          href="/packages"
          icon={Ship}
          accent="amber"
        />
        <StatCard
          label="Delivery Success"
          value={loading ? "—" : `${deliverySuccess}%`}
          href="/packages"
          icon={TrendingUp}
          accent="indigo"
        />
        <StatCard
          label="Outstanding"
          value={loading ? "—" : formatCurrencyTotals(outstandingTotals)}
          href="/payments"
          icon={Wallet}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-stretch">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
              Shipments Overview
            </h2>
            <TrendChart data={shipmentsOverTime} color="#4f46e5" />
          </section>

          <section className="flex flex-1 flex-col rounded-2xl border border-neutral-200/80 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
              Top Carrier Performance
            </h2>
            {carrierStats.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-neutral-300">
                <Truck size={28} />
                <p className="text-sm text-neutral-400">
                  Add a carrier to your packages to see performance here.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="py-2">Carrier</th>
                    <th className="py-2">Delivered</th>
                    <th className="py-2">In Transit</th>
                    <th className="py-2">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {carrierStats.map((c) => (
                    <tr key={c.carrier}>
                      <td className="py-2.5 font-medium text-neutral-900">
                        {c.carrier}
                      </td>
                      <td className="py-2.5 text-neutral-600">{c.delivered}</td>
                      <td className="py-2.5 text-neutral-600">{c.inTransit}</td>
                      <td className="py-2.5 text-neutral-600">
                        {c.successRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
              Shipments by Status
            </h2>
            <StatusDonutChart data={statusDonutData} />
          </section>

          <section className="flex flex-1 flex-col rounded-2xl border border-neutral-200/80 bg-white">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-base font-semibold text-neutral-900">Leads</h2>
              <Link
                href="/leads"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex gap-1 overflow-x-auto px-5 pt-3">
              {LEAD_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeadTab(tab)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    leadTab === tab
                      ? "bg-accent-600 text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <ul className="mt-3 divide-y divide-neutral-100">
              {!loading && filteredLeads.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-neutral-400">
                  No leads here.
                </li>
              )}
              {filteredLeads.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-xs font-semibold text-accent-700">
                    {initials(l.customerName || "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {l.customerName}
                      </p>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="truncate text-xs text-neutral-400">
                      {l.email || l.phone || "No contact info"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-neutral-400">
                      {timeAgo(l.date)}
                    </span>
                    {l.phone && (
                      <div className="flex gap-1">
                        <a
                          href={`tel:${l.phone}`}
                          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-accent-600"
                        >
                          <Phone size={13} />
                        </a>
                        {l.email && (
                          <a
                            href={`mailto:${l.email}`}
                            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-accent-600"
                          >
                            <Mail size={13} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Payments</h2>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
            <Link
              href="/payments"
              className="rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 p-5 text-white transition-transform hover:scale-[1.02]"
            >
              <div className="text-sm text-white/70">Total Revenue</div>
              <div className="mt-1 text-2xl font-semibold">
                {loading ? "—" : formatCurrencyTotals(totalRevenueTotals)}
              </div>
            </Link>
            <Link
              href="/payments"
              className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50"
            >
              <div className="text-sm text-neutral-500">Outstanding</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {loading ? "—" : formatCurrencyTotals(outstandingTotals)}
              </div>
            </Link>
            <Link
              href="/payments"
              className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50"
            >
              <div className="text-sm text-neutral-500">Pending</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {loading ? "—" : formatCurrencyTotals(pendingTotals)}
              </div>
            </Link>
          </div>

          <Link
            href="/payments"
            className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50 lg:col-span-2"
          >
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">
              Recent Transactions
            </h3>
            <ul className="divide-y divide-neutral-100">
              {recentPayments.length === 0 && (
                <li className="py-8 text-center text-sm text-neutral-400">
                  No payments yet.
                </li>
              )}
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {p.customerName}
                    </p>
                    <p className="text-xs text-neutral-400">{p.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {formatMoney(parseFloat(p.amount) || 0, p.currency)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Link>

          <Link
            href="/payments"
            className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50 lg:col-span-1"
          >
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">
              Revenue Trend {revenueTrend.length > 0 && `(${primaryCurrency})`}
            </h3>
            <TrendChart
              data={revenueTrend}
              color="#10b981"
              valuePrefix={primaryCurrency === "INR" ? "₹" : "$"}
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
