"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import AdminLayout from "../../layout";


type User = {
  id: string;
  auth_id: string;
  email: string;
  business_name: string;
  cif?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  approval_status?: string;
  created_at?: string;
  tax_id?: string;
  is_sso_user?: boolean;
  is_anonymous?: boolean;
  role?: string;
};

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "es" ? "es" : "en";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const json = await res.json();
        if (json.success) setUsers(json.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">{t("nav.users", safeLang)}</h1>

      {loading ? (
        <p>{safeLang === "es" ? "Cargando..." : "Loading..."}</p>
      ) : users.length === 0 ? (
        <p>{safeLang === "es" ? "No hay usuarios" : "No users found"}</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full table-auto border">
            <thead>
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Business Name</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Approval Status</th>
                <th className="border px-2 py-1">Created At</th>
                <th className="border px-2 py-1">Phone</th>
                <th className="border px-2 py-1">City</th>
                <th className="border px-2 py-1">Country</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="border px-2 py-1">{u.id}</td>
                  <td className="border px-2 py-1">{u.email}</td>
                  <td className="border px-2 py-1">{u.business_name}</td>
                  <td className="border px-2 py-1">{u.role}</td>
                  <td className="border px-2 py-1">{u.approval_status}</td>
                  <td className="border px-2 py-1">{u.created_at ? new Date(u.created_at).toLocaleString() : ""}</td>
                  <td className="border px-2 py-1">{u.phone}</td>
                  <td className="border px-2 py-1">{u.city}</td>
                  <td className="border px-2 py-1">{u.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
