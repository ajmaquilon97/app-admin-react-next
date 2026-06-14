import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatares de cuentas de Google (para cuando llegue el OAuth real).
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;

// Cloudflare Pages edge runtime setup (solo en desarrollo local)
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
  await setupDevPlatform();
}
