import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Ambassadors upload photos of notices from their phones.
    serverActions: { bodySizeLimit: "10mb" },
    // Enables forbidden() for role checks in the panel.
    authInterrupts: true,
  },
  async headers() {
    // Browsers must always revalidate the service worker so updates reach students.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
