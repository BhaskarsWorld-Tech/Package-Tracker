"use client";

import { useEffect, useState } from "react";
import { KeyRound, Trash2, ShieldCheck } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { Input, Label } from "@/components/FormField";
import { useCurrentUser } from "@/lib/useCurrentUser";

type AppUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const { isAdmin, role } = useCurrentUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load users");
      setUsers(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === null) return;
    if (isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
      load();
    } else {
      setLoading(false);
    }
  }, [isAdmin, role]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to reset password");
      setResetTarget(null);
      setNewPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(user: AppUser) {
    if (!confirm(`Delete the account for ${user.email}?`)) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    load();
  }

  if (role !== null && !isAdmin) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center text-sm text-neutral-500">
        Only an admin can manage user accounts.
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Users
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Reset passwords or remove accounts.
        </p>
      </div>

      {resetTarget && (
        <Modal
          title={`Reset password — ${resetTarget.email}`}
          onClose={() => {
            setResetTarget(null);
            setNewPassword("");
          }}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>New password</Label>
              <Input
                required
                autoFocus
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                At least 8 characters.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setNewPassword("");
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
                {saving ? "Saving…" : "Set Password"}
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
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8 text-center text-neutral-400" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <ShieldCheck className="text-neutral-300" size={28} />
                      <p className="text-sm text-neutral-400">No accounts yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="group hover:bg-neutral-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {u.email}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        u.role === "admin"
                          ? "bg-accent-50 text-accent-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetTarget(u)}
                        className="rounded-md p-1.5 text-neutral-300 opacity-0 transition-colors hover:bg-accent-50 hover:text-accent-600 group-hover:opacity-100"
                        title="Reset password"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => remove(u)}
                        className="rounded-md p-1.5 text-neutral-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        title="Delete account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
