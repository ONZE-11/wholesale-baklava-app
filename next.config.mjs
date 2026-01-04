/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,

  // ✅ برای جلوگیری از دعوای Next/Turbopack با Prisma
  serverExternalPackages: ["@prisma/client", "prisma"],

  // ✅ مطمئن می‌شه فایل‌های Prisma Client همراه خروجی deploy می‌رن
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
