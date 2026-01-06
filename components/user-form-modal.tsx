"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import type { User, ApprovalStatus } from "@/types/user";

type Mode = "create" | "edit";

type Props = {
  isOpen: boolean;
  mode: Mode;
  user: (User & { role?: string }) | null;
  onClose: () => void;
  onSubmit: (payload: Partial<User>) => void;
};

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

export function UserFormModal({ isOpen, mode, user, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [business_name, setBusinessName] = useState("");
  const [cif, setCif] = useState("");
  const [tax_id, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal_code, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const [role, setRole] = useState<string>("user");
  const [approval_status, setApprovalStatus] =
    useState<ApprovalStatus>("pending");

  const [error, setError] = useState<string | null>(null);

  const title = mode === "create" ? "Add user" : "Edit user";
  const desc =
    mode === "create"
      ? "Create a user and send a set-password email."
      : "Update user business profile details.";

  // ✅ sync on open
  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    setEmail(user?.email ?? "");
    setBusinessName(user?.business_name ?? "");
    setCif((user as any)?.cif ?? "");
    setTaxId((user as any)?.tax_id ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setCity(user?.city ?? "");
    setPostalCode((user as any)?.postal_code ?? "");
    setCountry(user?.country ?? "");

    setRole((user as any)?.role ?? "user");
    setApprovalStatus((user as any)?.approval_status ?? "pending");
  }, [isOpen, user]);

  const canSubmit = useMemo(() => {
    const requiredOk =
      normalizeEmail(email) &&
      business_name.trim() &&
      cif.trim() &&
      phone.trim() &&
      address.trim() &&
      city.trim() &&
      country.trim();

    return Boolean(requiredOk);
  }, [email, business_name, cif, phone, address, city, country]);

  const handleSubmit = () => {
    setError(null);

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) return setError("Email is required.");
    if (!business_name.trim()) return setError("Business name is required.");
    if (!cif.trim()) return setError("CIF is required.");
    if (!phone.trim()) return setError("Phone is required.");
    if (!address.trim()) return setError("Address is required.");
    if (!city.trim()) return setError("City is required.");
    if (!country.trim()) return setError("Country is required.");

    onSubmit({
      email: cleanEmail,
      business_name: business_name.trim(),
      cif: cif.trim(),
      tax_id: tax_id.trim() || null,
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postal_code: postal_code.trim() || null,
      country: country.trim(),
      role,
      approval_status,
    } as any);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          w-[calc(100vw-24px)]
          sm:max-w-2xl
          max-h-[90dvh]
          p-0
          overflow-hidden
          flex flex-col
        "
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b bg-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription>{desc}</DialogDescription>
          </DialogHeader>
        </div>

        {/* Body (scrollable) */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 pb-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input
                value={business_name}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CIF *</Label>
                <Input value={cif} onChange={(e) => setCif(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={tax_id} onChange={(e) => setTaxId(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={postal_code}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Country *</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Approval status</Label>
                <Input
                  value={approval_status}
                  onChange={(e) =>
                    setApprovalStatus(e.target.value as ApprovalStatus)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer (always visible) */}
        <div className="px-5 sm:px-6 py-4 border-t bg-white shrink-0 sticky bottom-0">
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
              {mode === "create" ? "Create & send email" : "Save changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
