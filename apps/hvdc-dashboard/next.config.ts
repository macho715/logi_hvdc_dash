import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isVercel = process.env.VERCEL === "1";

// Vercel 환경에서는 PWA 비활성화
const shouldUsePWA = !isDev && !isVercel;

let withPWA;
if (shouldUsePWA) {
  withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: isDev,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default isDev 
  ? nextConfig 
  : (shouldUsePWA ? withPWA(nextConfig) : nextConfig);
