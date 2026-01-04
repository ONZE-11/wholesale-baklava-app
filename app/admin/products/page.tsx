"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

type Product = {
  id: string;
  name_en: string | null;
  name_es: string | null;
  price: number | null;
  min_order_quantity: number | null;
  packaging_en: string | null;
  packaging_es: string | null;
  shelf_life_en: string | null;
  shelf_life_es: string | null;
};

export default function AdminProductsPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "en" ? "en" : "es";

  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProducts(json.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name_en: p.name_en ?? "",
      name_es: p.name_es ?? "",
      price: p.price ?? 0,
      min_order_quantity: p.min_order_quantity ?? 0,
      packaging_en: p.packaging_en ?? "",
      packaging_es: p.packaging_es ?? "",
      shelf_life_en: p.shelf_life_en ?? "",
      shelf_life_es: p.shelf_life_es ?? "",
    });
  }

  async function save(id: string) {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });

    const json = await res.json();
    if (!json.success) {
      alert(json.error);
      return;
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? json.product : p)));
    setEditingId(null);
    setForm({});
  }

  if (loading) return <p className="p-4">{t("common.loading", safeLang)}</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.products.title", safeLang)}</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">{t("admin.products.name_en", safeLang)}</th>
            <th className="border p-2">{t("admin.products.name_es", safeLang)}</th>
            <th className="border p-2 text-center">{t("admin.products.price", safeLang)}</th>
            <th className="border p-2 text-center">{t("admin.products.min_qty", safeLang)}</th>
            <th className="border p-2">{t("admin.products.packaging_en", safeLang)}</th>
            <th className="border p-2">{t("admin.products.packaging_es", safeLang)}</th>
            <th className="border p-2">{t("admin.products.shelf_life_en", safeLang)}</th>
            <th className="border p-2">{t("admin.products.shelf_life_es", safeLang)}</th>
            <th className="border p-2">{t("common.actions", safeLang)}</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => {
            const isEditing = editingId === p.id;

            return (
              <tr key={p.id}>
                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.name_en ?? ""}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.name_en || "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.name_es ?? ""}
                      onChange={(e) => setForm({ ...form, name_es: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.name_es || "—"
                  )}
                </td>

                <td className="border p-2 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={form.price ?? 0}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="border p-1 w-24 mx-auto text-center"
                    />
                  ) : (
                    p.price ?? "—"
                  )}
                </td>

                <td className="border p-2 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.min_order_quantity ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, min_order_quantity: Number(e.target.value) })
                      }
                      className="border p-1 w-24 mx-auto text-center"
                    />
                  ) : (
                    p.min_order_quantity ?? "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.packaging_en ?? ""}
                      onChange={(e) => setForm({ ...form, packaging_en: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.packaging_en || "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.packaging_es ?? ""}
                      onChange={(e) => setForm({ ...form, packaging_es: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.packaging_es || "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.shelf_life_en ?? ""}
                      onChange={(e) => setForm({ ...form, shelf_life_en: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.shelf_life_en || "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <input
                      value={form.shelf_life_es ?? ""}
                      onChange={(e) => setForm({ ...form, shelf_life_es: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    p.shelf_life_es || "—"
                  )}
                </td>

                <td className="border p-2">
                  {isEditing ? (
                    <div className="flex gap-3">
                      <button onClick={() => save(p.id)} className="text-green-700" type="button">
                        {t("common.save", safeLang)}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setForm({});
                        }}
                        className="text-gray-600"
                        type="button"
                      >
                        {t("common.cancel", safeLang)}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)} className="text-blue-700" type="button">
                      {t("common.edit", safeLang)}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
