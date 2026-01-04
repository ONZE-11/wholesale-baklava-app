"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function setAuthCookie(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth_user_id", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("auth_user_id")?.value || null
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_user_id")
}

export async function setAdminCookie(adminId: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth_admin_id", adminId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getAuthAdminId(): Promise<string | null> {
  const cookieStore = await cookies()
  const adminId = cookieStore.get("auth_admin_id")?.value || null

  if (!adminId) return null

  // بررسی اینکه واقعا ادمین است
  const admin = await db.users.findById(adminId)
  if (!admin || admin.role !== "admin") return null

  return adminId
}
