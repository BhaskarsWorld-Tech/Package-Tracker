"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Ship, PackageCheck, Wallet, ArrowRight, PackageSearch, UserPlus } from "lucide-react";
import type { Lead, Package, Payment } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import StatCard from "@/components/StatCard";
import { sumByCurrency, formatCurrencyTotals } from "@/lib/money";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const activeLeads = leads.filter(
    (l) => l.status !== "Converted" && l.status !== "Lost"
  );
  const inTransit = packages.filter(
    (p) => p.status === "In Transit" || p.status === "Customs"
  );
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

  if (error) {
    return <ErrorBanner message={error} />;
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of your India ⇄ USA shipping operation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Leads"
          value={loading ? "—" : activeLeads.length}
          href="/leads"
          icon={Users}
          accent="indigo"
        />
        <StatCard
          label="Packages In Transit"
          value={loading ? "—" : inTransit.length}
          href="/packages"
          icon={Ship}
          accent="blue"
        />
        <StatCard
          label="Total Packages"
          value={loading ? "—" : packages.length}
          href="/packages"
          icon={PackageCheck}
          accent="emerald"
        />
        <StatCard
          label="Outstanding Payments"
          value={loading ? "—" : formatCurrencyTotals(outstandingTotals)}
          href="/payments"
          icon={Wallet}
          accent="amber"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            Packages In Transit
          </h2>
          <Link
            href="/packages"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Weight</th>
                  <th className="px-5 py-3">Carrier / Tracking</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {!loading && inTransit.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                        <PackageSearch className="text-neutral-300" size={28} />
                        <p className="text-sm text-neutral-400">
                          Nothing in transit right now.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {inTransit.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-neutral-900">
                      {p.customerName}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{p.route}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {p.weightKg ? `${p.weightKg} kg` : "—"}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {p.carrier} {p.trackingNumber && `· ${p.trackingNumber}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {p.expectedDelivery || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Recent Leads</h2>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {!loading && activeLeads.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                        <UserPlus className="text-neutral-300" size={28} />
                        <p className="text-sm text-neutral-400">No active leads.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {activeLeads.slice(0, 8).map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-500">
                      {l.date}
                    </td>
                    <td className="px-5 py-3 font-medium text-neutral-900">
                      {l.customerName}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{l.route}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
