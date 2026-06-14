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
