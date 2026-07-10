"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, PackageSearch } from "lucide-react";
import type { Package, Lead, Payment } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { Input, Label, Select, Textarea } from "@/components/FormField";
import { formatMoney } from "@/lib/money";

const STATUSES = ["Pending Pickup", "In Transit", "Customs", "Delivered"];
const ROUTES = ["India → USA", "USA → India"];
const CURRENCIES = ["USD", "INR"];

const emptyForm = {
  leadId: "",
  customerName: "",
  originAddress: "",
  destinationAddress: "",
  route: ROUTES[0],
  weightKg: "",
  status: "Pending Pickup",
  shippedDate: "",
  expectedDelivery: "",
  carrier: "",
  trackingNumber: "",
  notes: "",
  amountDue: "",
  currency: CURRENCIES[0],
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  async function load() {
    setLoading(true);
    try {
      const [pkgRes, leadRes, payRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/leads"),
        fetch("/api/payments"),
      ]);
      const [pkgData, leadData, payData] = await Promise.all([
        pkgRes.json(),
        leadRes.json(),
        payRes.json(),
      ]);
      if (!pkgRes.ok || !leadRes.ok || !payRes.ok) {
        throw new Error(
          pkgData?.error ?? leadData?.error ?? payData?.error ?? "Failed to load packages"
        );
      }
      setPackages(pkgData);
      setLeads(leadData);
      setPayments(payData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function paidFor(pkg: Package) {
    return payments
      .filter((p) => p.packageId === pkg.id && p.currency === pkg.currency)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
  }, []);

  const filtered = useMemo(
    () =>
      filter === "All" ? packages : packages.filter((p) => p.status === filter),
    [packages, filter]
  );

  function selectLead(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    setForm({
      ...form,
      leadId,
      customerName: lead?.customerName ?? form.customerName,
      route: lead?.route || form.route,
      originAddress: lead?.fromAddress || form.originAddress,
      destinationAddress: lead?.shipToAddress || form.destinationAddress,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    await fetch(`/api/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this package?")) return;
    await fetch(`/api/packages/${id}`, { method: "DELETE" });
    load();
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Packages
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every shipment, from pickup to delivery.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 transition-colors hover:bg-accent-700"
        >
          <Plus size={16} /> New Package
        </button>
      </div>

      {showForm && (
        <Modal title="New Package" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Link to a lead (optional)</Label>
              <Select value={form.leadId} onChange={(e) => selectLead(e.target.value)}>
                <option value="">None</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.customerName} ({l.date})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Customer name</Label>
              <Input
                required
                autoFocus
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label>Route</Label>
              <Select
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
              >
                {ROUTES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origin address</Label>
                <Textarea
                  rows={2}
                  value={form.originAddress}
                  onChange={(e) => setForm({ ...form, originAddress: e.target.value })}
                />
              </div>
              <div>
                <Label>Destination address</Label>
                <Textarea
                  rows={2}
                  value={form.destinationAddress}
                  onChange={(e) =>
                    setForm({ ...form, destinationAddress: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Amount due (shipping charge)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amountDue}
                  onChange={(e) => setForm({ ...form, amountDue: e.target.value })}
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shipped date</Label>
                <Input
                  type="date"
                  value={form.shippedDate}
                  onChange={(e) => setForm({ ...form, shippedDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expected delivery</Label>
                <Input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) =>
                    setForm({ ...form, expectedDelivery: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Carrier</Label>
                <Input
                  placeholder="DHL, FedEx, etc."
                  value={form.carrier}
                  onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                />
              </div>
              <div>
                <Label>Tracking number</Label>
                <Input
                  value={form.trackingNumber}
                  onChange={(e) =>
                    setForm({ ...form, trackingNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 hover:bg-accent-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Package"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="flex flex-wrap gap-2">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">From / To</th>
                <th className="px-5 py-3">Weight</th>
                <th className="px-5 py-3">Carrier / Tracking</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">ETA</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8 text-center text-neutral-400" colSpan={9}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <PackageSearch className="text-neutral-300" size={28} />
                      <p className="text-sm text-neutral-400">No packages yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((pkg) => (
                <tr key={pkg.id} className="group align-top hover:bg-neutral-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {pkg.customerName}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{pkg.route}</td>
                  <td className="max-w-[220px] px-5 py-3 text-neutral-500">
                    <div className="truncate">{pkg.originAddress}</div>
                    <div className="truncate">→ {pkg.destinationAddress}</div>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">
                    {pkg.weightKg ? `${pkg.weightKg} kg` : "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    <div>{pkg.carrier || "—"}</div>
                    <div className="text-xs">{pkg.trackingNumber}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={pkg.status} />
                      <select
                        value={pkg.status}
                        onChange={(e) => updateStatus(pkg.id, e.target.value)}
                        className="cursor-pointer rounded-md border-0 bg-transparent text-xs text-neutral-400 opacity-0 outline-none group-hover:opacity-100 focus:opacity-100"
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {pkg.amountDue ? (
                      (() => {
                        const due = parseFloat(pkg.amountDue) || 0;
                        const paid = paidFor(pkg);
                        const remaining = due - paid;
                        return (
                          <div>
                            <div
                              className={
                                remaining <= 0
                                  ? "font-medium text-emerald-600"
                                  : "font-medium text-amber-600"
                              }
                            >
                              {remaining <= 0
                                ? "Paid in full"
                                : `${formatMoney(remaining, pkg.currency)} due`}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {formatMoney(paid, pkg.currency)} of{" "}
                              {formatMoney(due, pkg.currency)} paid
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-neutral-500">
                    {pkg.expectedDelivery || "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(pkg.id)}
                      className="rounded-md p-1.5 text-neutral-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
