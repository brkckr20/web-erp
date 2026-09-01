import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["jspdf"],
  turbopack: {},
};

export default nextConfig;
