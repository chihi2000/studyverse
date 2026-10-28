import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Ambassadors upload photos of notices from their phones.
    serverActions: { bodySizeLimit: "10mb" },
    // Enables forbidden() for role checks in the panel.
    authInterrupts: true,
  },
};

export default nextConfig;
