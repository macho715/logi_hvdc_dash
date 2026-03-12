import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default isDev ? nextConfig : withPWA(nextConfig);
