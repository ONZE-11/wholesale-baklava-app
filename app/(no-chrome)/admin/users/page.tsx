"use client";

import { useEffect, useMemo, useState } from "react";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

import { formatFullAddress } from "@/lib/formatters/address";
import type { User, ApprovalStatus } from "@/types/user";

import { UserDetailsModal } from "@/components/user-details-modal";
import { UserFormModal } from "@/components/user-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

// ✅ JSON-safe response parser
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { success: false, error: text || "Non-JSON response" };
  }
}

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "en" ? "en" : "es";

  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ per-row resend state (stores email being resent)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all");

  // Status modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formUser, setFormUser] = useState<User | null>(null);

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await safeJson(res);

      if (res.ok && json?.success) setUsers(json.users ?? []);
      else {
        console.error("Fetch users error:", { status: res.status, json });
        alert(json?.error || t("admin.users.errors.fetch", safeLang));
      }
    } catch (err) {
      console.error(err);
      alert(t("admin.users.errors.fetch", safeLang));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Sync selected user when list changes
  useEffect(() => {
    if (!selectedUser) return;
    const fresh = users.find((u) => u.id === selectedUser.id);
    if (fresh) setSelectedUser(fresh);
  }, [users, selectedUser?.id]);

  // ===== filtered list =====
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const matchesStatus = statusFilter === "all" ? true : u.approval_status === statusFilter;

      const addr = formatFullAddress({
        address: u.address ?? null,
        city: u.city ?? null,
        postal_code: u.postal_code ?? null,
        country: u.country ?? null,
      });

      const hay = `${u.email} ${u.business_name} ${u.role ?? ""} ${addr}`.toLowerCase();
      const matchesQuery = q ? hay.includes(q) : true;

      return matchesStatus && matchesQuery;
    });
  }, [users, query, statusFilter]);

  // ===== actions =====
  const openStatusModal = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const openCreate = () => {
    setFormMode("create");
    setFormUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setFormMode("edit");
    setFormUser(user);
    setFormOpen(true);
  };

  const openDelete = (user: User) => {
    setDeleteTarget(user);
    setConfirmOpen(true);
  };

  const resendSetPassword = async (u: User) => {
    if (!u?.email) return alert("Missing email");
    if (resendingEmail) return;

    setResendingEmail(u.email);

    try {
      const res = await fetch("/api/admin/users/resend-set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: u.email,
          business_name: u.business_name,
          redirectTo: `${window.location.origin}/reset-password`,
          lang: safeLang,
        }),
      });

      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        console.error("Resend set-password error:", { status: res.status, json });
        alert(json?.error || "Resend failed");
        return;
      }

      alert(
        t("admin.users.resend_sent", safeLang) ||
          "Set-password link sent."
      );
    } catch (err) {
      console.error(err);
      alert("Resend failed");
    } finally {
      setResendingEmail(null);
    }
  };

  const updateUserStatus = async (userId: string, status: ApprovalStatus, notes?: string) => {
    if (!userId) return alert(t("admin.users.errors.missing_id", safeLang));

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      const json = await safeJson(res);

      if (res.ok && json?.success) {
        setDetailsOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        console.error("Update status error:", { status: res.status, json });
        alert(json?.error || t("admin.users.errors.update", safeLang));
      }
    } catch (err) {
      console.error(err);
      alert(t("admin.users.errors.update", safeLang));
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await safeJson(res);

      if (res.ok && json?.success) {
        setConfirmOpen(false);
        setDeleteTarget(null);

        if (selectedUser?.id === userId) {
          setDetailsOpen(false);
          setSelectedUser(null);
        }

        fetchUsers();
      } else {
        console.error("Delete user error:", { status: res.status, json });
        alert(json?.error || t("admin.users.errors.delete", safeLang));
      }
    } catch (err) {
      console.error(err);
      alert(t("admin.users.errors.delete", safeLang));
    }
  };

  const submitUserForm = async (payload: Partial<User>) => {
    if (saving) return;
    setSaving(true);

    try {
      if (formMode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            redirectTo: `${window.location.origin}/reset-password`,
            lang: safeLang,
          }),
        });

        const json = await safeJson(res);
        if (!res.ok || !json?.success) throw new Error(json?.error || "Create failed");
      } else {
        const id = formUser?.id;
        if (!id) throw new Error("Missing user id for edit");

        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await safeJson(res);
        if (!res.ok || !json?.success) throw new Error(json?.error || "Update failed");
      }

      setFormOpen(false);
      setFormUser(null);
      await fetchUsers();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || t("admin.users.errors.save", safeLang));
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = (s: ApprovalStatus) => {
    switch (s) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "request_docs":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "approved":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const requestDocs = async (userId: string) => {
    if (!userId) return alert(t("admin.users.errors.missing_id", safeLang));

    try {
      const res = await fetch(`/api/admin/users/${userId}/request-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t("email.request_docs_short", safeLang),
        }),
      });

      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        console.error("Request docs email error:", { status: res.status, json });
        return alert(json?.error || t("admin.users.errors.request_docs", safeLang));
      }

      await updateUserStatus(userId, "request_docs");
      alert(t("admin.users.request_docs_sent", safeLang));
    } catch (err) {
      console.error(err);
      alert(t("admin.users.errors.request_docs", safeLang));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <button
          className="px-3 py-2 rounded bg-black text-white hover:opacity-90 disabled:opacity-60 text-sm"
          onClick={openCreate}
          disabled={saving || loading}
          title={saving ? "Saving..." : ""}
          type="button"
        >
          + {t("admin.users.add", safeLang)}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="border rounded px-3 py-2 w-full md:w-80 text-sm"
          placeholder={t("admin.users.search_placeholder", safeLang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border rounded px-3 py-2 w-full md:w-56 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | ApprovalStatus)}
        >
          <option value="all">{t("common.all_statuses", safeLang)}</option>
          <option value="pending">{t("admin.status.pending", safeLang)}</option>
          <option value="request_docs">{t("admin.status.request_docs", safeLang)}</option>
          <option value="approved">{t("admin.status.approved", safeLang)}</option>
          <option value="rejected">{t("admin.status.rejected", safeLang)}</option>
        </select>

        <button
          className="px-3 py-2 rounded border hover:bg-gray-50 w-full md:w-auto text-sm"
          onClick={fetchUsers}
          disabled={loading}
          type="button"
        >
          {t("common.refresh", safeLang)}
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.email", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.business_name", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.role", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.status", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.phone", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.address", safeLang)}
                </th>
                <th className="border-b px-3 py-2 text-left text-sm">
                  {t("admin.actions", safeLang)}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                    {t("common.loading", safeLang)}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                    {t("admin.users.no_users", safeLang)}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const addr = formatFullAddress({
                    address: u.address ?? null,
                    city: u.city ?? null,
                    postal_code: u.postal_code ?? null,
                    country: u.country ?? null,
                  });

                  const isResendingThisRow = resendingEmail === u.email;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="border-b px-3 py-2 text-sm">{u.email}</td>
                      <td className="border-b px-3 py-2 text-sm font-medium">{u.business_name}</td>
                      <td className="border-b px-3 py-2 text-sm">{u.role ?? "—"}</td>

                      <td className="border-b px-3 py-2 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded border text-xs ${statusBadgeClass(
                            u.approval_status
                          )}`}
                        >
                          {t(`admin.status.${u.approval_status}` as any, safeLang)}
                        </span>
                      </td>

                      <td className="border-b px-3 py-2 text-sm">{u.phone ?? "—"}</td>

                      <td
                        className="border-b px-3 py-2 text-sm max-w-[420px] truncate"
                        title={addr}
                      >
                        {addr}
                      </td>

                      <td className="border-b px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            className="px-2 py-1 rounded border hover:bg-gray-50"
                            onClick={() => openStatusModal(u)}
                            type="button"
                          >
                            {t("admin.users.actions.status", safeLang)}
                          </button>

                          {/* ✅ Resend set-password link */}
                          <button
                            className="px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-60"
                            onClick={() => resendSetPassword(u)}
                            type="button"
                            disabled={loading || saving || isResendingThisRow}
                            title={isResendingThisRow ? "Sending..." : ""}
                          >
                            {isResendingThisRow ? "Sending..." : "Resend link"}
                          </button>

                          <button
                            className="px-2 py-1 rounded border hover:bg-gray-50"
                            onClick={() => openEdit(u)}
                            type="button"
                          >
                            {t("common.edit", safeLang)}
                          </button>

                          <button
                            className="px-2 py-1 rounded bg-red-600 text-white hover:opacity-90"
                            onClick={() => openDelete(u)}
                            type="button"
                          >
                            {t("common.delete", safeLang)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onApprove={(id) => updateUserStatus(id, "approved")}
        onRequestDocs={requestDocs}
        onReject={(id) => updateUserStatus(id, "rejected")}
        lang={safeLang}
      />

      {/* Add/Edit modal */}
      <UserFormModal
        isOpen={formOpen}
        mode={formMode}
        user={formUser ? { ...formUser, role: formUser.role ?? undefined } : null}
        onClose={() => setFormOpen(false)}
        onSubmit={(payload) => {
          const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== null)
          ) as Partial<User>;
          submitUserForm(cleanPayload);
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={t("admin.users.delete_title", safeLang)}
        description={
          deleteTarget
            ? t("admin.users.delete_desc", safeLang).replace("{email}", deleteTarget.email)
            : t("admin.users.delete_desc_generic", safeLang)
        }
        confirmText={t("common.delete", safeLang)}
        cancelText={t("common.cancel", safeLang)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => deleteTarget?.id && deleteUser(deleteTarget.id)}
        destructive
      />
    </div>
  );
}
