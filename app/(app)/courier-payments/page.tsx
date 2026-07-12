"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import type { CourierPayment, Package } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import { Input, Label, Select, Textarea } from "@/components/FormField";
import { formatMoney, sumByCurrency, formatCurrencyTotals } from "@/lib/money";
import { useCurrentUser } from "@/lib/useCurrentUser";

const CUSTOMER_PAYMENT_STATUSES = ["Pending", "Paid", "Partial"];
const PAYMENT_SOURCES = ["Cash", "Bank Transfer", "UPI", "Zelle", "Card", "Other"];
const CURRENCIES = ["USD", "INR"];

const emptyForm = {
  packageId: "",
  customerName: "",
  paidContactName: "",
  paidContactNumber: "",
  paidBy: "",
  total: "",
  currency: CURRENCIES[0],
  paymentSource: PAYMENT_SOURCES[0],
  customerPaymentStatus: "Pending",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function CourierPaymentsPage() {
  const { isAdmin } = useCurrentUser();
  const [entries, setEntries] = useState<CourierPayment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [entriesRes, pkgRes] = await Promise.all([
        fetch("/api/courier-payments"),
        fetch("/api/packages"),
      ]);
      const [entriesData, pkgData] = await Promise.all([
        entriesRes.json(),
        pkgRes.json(),
      ]);
      if (!entriesRes.ok || !pkgRes.ok) {
        throw new Error(
          entriesData?.error ?? pkgData?.error ?? "Failed to load courier payments"
        );
      }
      setEntries(entriesData);
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

  const totalPaidOut = useMemo(() => sumByCurrency(entries.map((e) => ({ amount: e.total, currency: e.currency }))), [entries]);
  const awaitingReimbursement = useMemo(
    () =>
      sumByCurrency(
        entries
          .filter((e) => e.customerPaymentStatus !== "Paid")
          .map((e) => ({ amount: e.total, currency: e.currency }))
      ),
    [entries]
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

  function openNewForm() {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await fetch(`/api/courier-payments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/courier-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function updateCustomerPaymentStatus(id: string, customerPaymentStatus: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, customerPaymentStatus } : e))
    );
    await fetch(`/api/courier-payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerPaymentStatus }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this courier payment?")) return;
    await fetch(`/api/courier-payments/${id}`, { method: "DELETE" });
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
            Courier Payments
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Money paid out to courier services, and whether the customer has
            reimbursed you for it.
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 transition-colors hover:bg-accent-700"
        >
          <Plus size={16} /> New Courier Payment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Paid to Couriers"
          value={loading ? "—" : formatCurrencyTotals(totalPaidOut)}
          href="/courier-payments"
          icon={Truck}
          accent="blue"
        />
        <StatCard
          label="Awaiting Customer Reimbursement"
          value={loading ? "—" : formatCurrencyTotals(awaitingReimbursement)}
          href="/courier-payments"
          icon={Truck}
          accent="amber"
        />
      </div>

      {showForm && (
        <Modal
          title={editingId ? "Edit Courier Payment" : "New Courier Payment"}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        >
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paid contact name</Label>
                <Input
                  placeholder="Courier agent / office"
                  value={form.paidContactName}
                  onChange={(e) => setForm({ ...form, paidContactName: e.target.value })}
                />
              </div>
              <div>
                <Label>Paid contact number</Label>
                <Input
                  value={form.paidContactNumber}
                  onChange={(e) =>
                    setForm({ ...form, paidContactNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Paid by</Label>
              <Input
                placeholder="Who made this payment"
                value={form.paidBy}
                onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Total</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={form.total}
                  onChange={(e) => setForm({ ...form, total: e.target.value })}
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
                <Label>Payment source</Label>
                <Select
                  value={form.paymentSource}
                  onChange={(e) => setForm({ ...form, paymentSource: e.target.value })}
                >
                  {PAYMENT_SOURCES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Customer payment status</Label>
                <Select
                  value={form.customerPaymentStatus}
                  onChange={(e) =>
                    setForm({ ...form, customerPaymentStatus: e.target.value })
                  }
                >
                  {CUSTOMER_PAYMENT_STATUSES.map((s) => (
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
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 hover:bg-accent-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Save Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50/70 text-left text-xs font-medium uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Paid To</th>
                <th className="px-5 py-3">Paid By</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Customer Paid Us?</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8 text-center text-neutral-400" colSpan={8}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <Truck className="text-neutral-300" size={28} />
                      <p className="text-sm text-neutral-400">
                        No courier payments recorded yet.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="group hover:bg-neutral-50/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500">
                    {e.date}
                  </td>
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {e.customerName}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    <div>{e.paidContactName || "—"}</div>
                    <div className="text-xs">{e.paidContactNumber}</div>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{e.paidBy || "—"}</td>
                  <td className="px-5 py-3 text-neutral-700">
                    {formatMoney(parseFloat(e.total) || 0, e.currency)}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{e.paymentSource}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={e.customerPaymentStatus} />
                      <select
                        value={e.customerPaymentStatus}
                        onChange={(ev) =>
                          updateCustomerPaymentStatus(e.id, ev.target.value)
                        }
                        className="cursor-pointer rounded-md border-0 bg-transparent text-xs text-neutral-400 opacity-0 outline-none group-hover:opacity-100 focus:opacity-100"
                      >
                        {CUSTOMER_PAYMENT_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && (
                      <button
                        onClick={() => remove(e.id)}
                        className="rounded-md p-1.5 text-neutral-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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
