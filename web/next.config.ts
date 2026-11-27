import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["jspdf"],
  turbopack: {
    // @tradik/xslt-processor yalnızca XSLT 2.0/3.0 için gereken isteğe bağlı
    // @tradik/xslt3 eklentisini dinamik import eder; kurulu olmadığı için
    // paketleyici çözemiyor. XSLT 1.0 kullandığımızdan yer tutucuya yönlendirilir.
    resolveAlias: {
      "@tradik/xslt3": "./src/lib/xslt3-yok.ts",
    },
  },
  // Next 16 dev sunucusu, localhost dışından gelen /_next isteklerini varsayılan olarak 403 ile engelliyor.
  allowedDevOrigins: ["192.168.1.*", "192.168.1.16"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:3001/api/:path*" },
      { source: "/uploads/:path*", destination: "http://127.0.0.1:3001/uploads/:path*" },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/sw.dev.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
