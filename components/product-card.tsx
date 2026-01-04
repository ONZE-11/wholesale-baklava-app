"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { useState } from "react";

export interface ProductCardProps {
  product: any;
  isApproved: boolean;
  isAuthenticated: boolean;
  approvalStatus?: "pending" | "approved" | "rejected" | "request_docs" | string;
  lang: "en" | "es";
  onAddToCart?: () => void;
}


export function ProductCard({
  product,
  isApproved,
  isAuthenticated,
  approvalStatus,
  lang,
  onAddToCart,
}: ProductCardProps) {
  const name = lang === "es" ? product.name_es : product.name_en;
  const price = product.price;
  const unit = product.unit;
  const minQuantity = product.min_order_quantity;

  const statusHref =
    approvalStatus === "request_docs" ? "/dashboard" : "/dashboard"; // اگر خواستی مسیر جدا بذاری

  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
      <Link href={`/products/${product.id}?lang=${lang}`}>
        <img
          src={product.image_url}
          alt={name}
          className="w-full h-64 object-cover rounded cursor-pointer mb-4"
        />
      </Link>

      <div className="flex justify-between items-baseline mb-1">
        <h3 className="font-semibold text-lg">{name}</h3>
        {isApproved && (
          <p className="text-muted-foreground font-medium">
            €{price} / {unit}
          </p>
        )}
      </div>

      {isApproved && (
        <p className="text-sm text-gray-500 mb-3">
          {lang === "es" ? `Pedido mínimo: ${minQuantity}` : `Min order: ${minQuantity}`}
        </p>
      )}

      {/* ✅ Approved */}
      {isApproved ? (
        <>
          <div className="flex gap-2 mb-3">
            <button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded transition-colors duration-150"
              onClick={() => onAddToCart && onAddToCart()}
            >
              {lang === "es" ? "Añadir al carrito" : "Add to Cart"}
            </button>
          </div>

          <Link href={`/products/${product.id}?lang=${lang}`}>
            <button className="w-full border border-gray-300 hover:border-gray-500 text-gray-700 px-4 py-2 rounded transition-colors duration-150">
              {lang === "es" ? "Detalles" : "Details"}
            </button>
          </Link>
        </>
      ) : (
        <>
          {/* ✅ Not approved */}
          <p className="text-red-600 mb-3 font-medium text-center">
            {isAuthenticated
              ? lang === "es"
                ? "Tu cuenta está pendiente. Ver estado."
                : "Your account is pending. View status."
              : lang === "es"
                ? "Regístrese para ver precios"
                : "Register to see prices"}
          </p>

          {isAuthenticated ? (
            <Link href={statusHref}>
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded transition-colors duration-150">
                {lang === "es" ? "Ir al panel" : "Go to dashboard"}
              </button>
            </Link>
          ) : (
            <Link href="/register">
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded transition-colors duration-150">
                {lang === "es" ? "Registrarse" : "Register"}
              </button>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
