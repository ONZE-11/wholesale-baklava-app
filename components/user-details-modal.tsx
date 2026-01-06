"use client";

import React, { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  CalendarDays,
  FileText,
} from "lucide-react";
import { formatFullAddress } from "@/lib/formatters/address";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "request_docs";

export interface User {
  id: string;
  email: string;
  business_name: string;
  approval_status: ApprovalStatus;

  role?: string;
  phone?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  rejection_notes?: string;
}

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onRequestDocs: (userId: string) => void;
  lang: "en" | "es";
}

function statusBadgeClass(s: ApprovalStatus) {
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
}

function formatDateYMD(date?: string) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function Field({
  icon,
  label,
  value,
  emptyText,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
  emptyText: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-gray-50/50 px-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">
          {value?.trim() ? value : emptyText}
        </p>
      </div>
    </div>
  );
}

function statusText(status: ApprovalStatus, lang: "en" | "es") {
  const key = `admin.status.${status}`;
  const translated = t(key, lang);
  return translated === key ? status : translated;
}

function roleText(role: string | undefined, lang: "en" | "es", empty: string) {
  const r = role?.trim();
  if (!r) return empty;

  const key = `admin.role.${r}`;
  const translated = t(key, lang);
  return translated === key ? r : translated;
}

export function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRequestDocs,
  lang,
}: UserDetailsModalProps) {
  if (!user) return null;

  const empty = t("common.empty", lang) || "—";

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          w-[calc(100vw-24px)]
          sm:max-w-2xl
          max-h-[85vh]
          p-0
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-b from-gray-50 to-white border-b">
          <DialogHeader>
            <DialogTitle className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="truncate">{user.business_name}</span>
                </div>

                <DialogDescription className="mt-1 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {t("admin.registered_on", lang)}:{" "}
                    {formatDateYMD(user.created_at)}
                  </span>
                </DialogDescription>
              </div>

              <Badge
                className={`shrink-0 border px-3 ${statusBadgeClass(
                  user.approval_status
                )}`}
              >
                {statusText(user.approval_status, lang)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body (scrollable) */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto max-h-[calc(85vh-170px)] space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              icon={<Mail className="h-4 w-4" />}
              label={t("admin.email", lang)}
              value={user.email}
              emptyText={empty}
            />
            <Field
              icon={<Phone className="h-4 w-4" />}
              label={t("admin.phone", lang)}
              value={user.phone ?? ""}
              emptyText={empty}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              icon={<Shield className="h-4 w-4" />}
              label={t("admin.role", lang)}
              value={roleText(user.role, lang, empty)}
              emptyText={empty}
            />
            <Field
              icon={<FileText className="h-4 w-4" />}
              label={t("admin.tax_id", lang)}
              value={user.tax_id ?? ""}
              emptyText={empty}
            />
          </div>

          <Field
            icon={<MapPin className="h-4 w-4" />}
            label={t("admin.address", lang)}
            value={formatFullAddress({
              address: user.address,
              city: user.city,
              postal_code: user.postal_code,
              country: user.country,
            })}
            emptyText={empty}
          />

          {user.approval_status === "rejected" && user.rejection_notes && (
            <div className="rounded-lg border bg-red-50 px-4 py-3">
              <p className="text-xs text-red-700 font-medium">
                {t("admin.rejection_notes", lang)}
              </p>
              <p className="text-sm text-red-900 mt-1">
                {user.rejection_notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button className="w-full" onClick={() => onApprove(user.id)}>
              {t("admin.approve", lang)}
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => onRequestDocs(user.id)}
            >
              {t("admin.request_docs", lang)}
            </Button>

            <Button
              className="w-full"
              variant="destructive"
              onClick={() => onReject(user.id)}
            >
              {t("admin.reject", lang)}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            {t("admin.actions_hint", lang)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
