"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import type { Lead } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { Input, Label, Select, Textarea } from "@/components/FormField";

const STATUSES = ["New", "Contacted", "Quoted", "Converted", "Lost"];
const ROUTES = ["India → USA", "USA → India"];

const emptyForm = {
  customerName: "",
  phone: "",
  email: "",
  route: ROUTES[0],
  status: "New",
  notes: "",
  fromAddress: "",
  shipToAddress: "",
  shipToContactName: "",
  shipToContactPhone: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load leads");
      setLeads(data);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/leads", {
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
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
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
            Leads
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Prospective customers in your pipeline.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-600/20 transition-colors hover:bg-accent-700"
        >
          <Plus size={16} /> New Lead
        </button>
      </div>

      {showForm && (
        <Modal title="New Lead" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer&apos;s address (from)</Label>
                <Textarea
                  rows={2}
                  value={form.fromAddress}
                  onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
                />
              </div>
              <div>
                <Label>Ship to address</Label>
                <Textarea
                  rows={2}
                  value={form.shipToAddress}
                  onChange={(e) => setForm({ ...form, shipToAddress: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ship to contact name</Label>
                <Input
                  value={form.shipToContactName}
                  onChange={(e) =>
                    setForm({ ...form, shipToContactName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Ship to contact phone</Label>
                <Input
                  value={form.shipToContactPhone}
                  onChange={(e) =>
                    setForm({ ...form, shipToContactPhone: e.target.value })
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
                {saving ? "Saving…" : "Save Lead"}
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
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Ship To</th>
                <th className="px-5 py-3">Status</th>
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
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <UserPlus className="text-neutral-300" size={28} />
                      <p className="text-sm text-neutral-400">No leads yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-neutral-50/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500">
                    {lead.date}
                  </td>
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {lead.customerName}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {lead.phone} {lead.email && `· ${lead.email}`}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{lead.route}</td>
                  <td className="max-w-[200px] px-5 py-3 text-neutral-500">
                    <div className="truncate">{lead.shipToAddress || "—"}</div>
                    {(lead.shipToContactName || lead.shipToContactPhone) && (
                      <div className="truncate text-xs text-neutral-400">
                        {lead.shipToContactName}
                        {lead.shipToContactName && lead.shipToContactPhone && " · "}
                        {lead.shipToContactPhone}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lead.status} />
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="cursor-pointer rounded-md border-0 bg-transparent text-xs text-neutral-400 opacity-0 outline-none group-hover:opacity-100 focus:opacity-100"
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(lead.id)}
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
