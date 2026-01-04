// lib/prisma.ts
import { PrismaClient } from "../lib/generated/prisma/client"; // مسیر خودت را اصلاح کن

declare global {
  // اضافه کردن prisma به globalThis برای جلوگیری از multiple clients در dev
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prisma ??
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL || "", // مقدار معتبر از .env
    log: ["error", "warn"],
  });

// فقط در محیط توسعه، singleton روی global ذخیره می‌شود
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
