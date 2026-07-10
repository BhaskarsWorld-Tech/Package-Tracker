"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import type { Payment, Package } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { Input, Label, Select, Textarea } from "@/components/FormField";
import { formatMoney, sumByCurrency, formatCurrencyTotals } from "@/lib/money";

const STATUSES = ["Pending", "Paid", "Partial", "Refunded"];
const METHODS = ["Cash", "Bank Transfer", "UPI", "Zelle", "Card", "Other"];
const CURRENCIES = ["USD", "INR"];

const emptyForm = {
  packageId: "",
  customerName: "",
  amount: "",
  currency: CURRENCIES[0],
  method: METHODS[0],
  status: "Pending",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [payRes, pkgRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/packages"),
      ]);
      const [payData, pkgData] = await Promise.all([
        payRes.json(),
        pkgRes.json(),
      ]);
      if (!payRes.ok || !pkgRes.ok) {
        throw new Error(
          payData?.error ?? pkgData?.error ?? "Failed to load payments"
        );
      }
      setPayments(payData);
      setPackages(pkgData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
  }, []);

  function paidFor(pkg: Package) {
    return payments
      .filter((p) => p.packageId === pkg.id && p.currency === pkg.currency)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  const balances = useMemo(
    () =>
      packages
        .filter((pkg) => pkg.amountDue)
        .map((pkg) => {
          const due = parseFloat(pkg.amountDue) || 0;
          const paid = paidFor(pkg);
          return { pkg, due, paid, remaining: due - paid };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paidFor closes over payments/packages already in deps
    [packages, payments]
  );

  const outstandingTotals = useMemo(
    () =>
      sumByCurrency(
        balances
          .filter((b) => b.remaining > 0)
          .map((b) => ({ amount: String(b.remaining), currency: b.pkg.currency }))
      ),
    [balances]
  );

  function selectPackage(packageId: string) {
    const pkg = packages.find((p) => p.id === packageId);
    setForm({
      ...form,
      packageId,
      customerName: pkg?.customerName ?? form.customerName,
      currency: pkg?.currency || form.currency,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this payment?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
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
            Payments
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Outstanding balance:{" "}
            <span className="font-medium text-neutral-700">
              {formatCurrencyTotals(outstandingTotals)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 transition-colors hover:bg-accent-700"
        >
          <Plus size={16} /> New Payment
        </button>
      </div>

      {showForm && (
        <Modal title="New Payment" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Link to a package (optional)</Label>
              <Select
                value={form.packageId}
                onChange={(e) => selectPackage(e.target.value)}
              >
                <option value="">None</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.customerName} — {p.trackingNumber || p.id.slice(0, 8)}
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
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Amount</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
                <Label>Method</Label>
                <Select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  {METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
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
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
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
                {saving ? "Saving…" : "Save Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {balances.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-neutral-900">
            Balances by Shipment
          </h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Shipment</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Settled</th>
                    <th className="px-5 py-3">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {balances.map(({ pkg, due, paid, remaining }) => (
                    <tr key={pkg.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-neutral-900">
                        {pkg.customerName}
                      </td>
                      <td className="px-5 py-3 text-neutral-500">
                        {pkg.trackingNumber || pkg.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 text-neutral-700">
                        {formatMoney(due, pkg.currency)}
                      </td>
                      <td className="px-5 py-3 text-neutral-700">
                        {formatMoney(paid, pkg.currency)}
                      </td>
                      <td className="px-5 py-3">
                        {remaining <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Settled
                          </span>
                        ) : (
                          <span className="font-medium text-amber-600">
                            {formatMoney(remaining, pkg.currency)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section>
        {balances.length > 0 && (
          <h2 className="mb-3 text-base font-semibold text-neutral-900">
            All Payments
          </h2>
        )}
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-neutral-400" colSpan={7}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                        <Wallet className="text-neutral-300" size={28} />
                        <p className="text-sm text-neutral-400">No payments yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="group hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-500">
                      {p.date}
                    </td>
                    <td className="px-5 py-3 font-medium text-neutral-900">
                      {p.customerName}
                    </td>
                    <td className="px-5 py-3 text-neutral-700">
                      {formatMoney(parseFloat(p.amount) || 0, p.currency)}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{p.method}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <select
                          value={p.status}
                          onChange={(e) => updateStatus(p.id, e.target.value)}
                          className="cursor-pointer rounded-md border-0 bg-transparent text-xs text-neutral-400 opacity-0 outline-none group-hover:opacity-100 focus:opacity-100"
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-neutral-500">
                      {p.notes}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => remove(p.id)}
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
      </section>
    </div>
  );
}
