/* =========================
   User & Approval Types
========================= */

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "request_docs";

export interface User {
  id: string;

  // auth
  auth_id?: string;

  // identity
  email: string;

  // business
  business_name: string;
  cif?: string;
  tax_id?: string;

  // contact
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;

  // admin
  role?: "admin" | "user";
  approval_status: ApprovalStatus;
  rejection_notes?: string;

  // meta
  created_at?: string;
}
