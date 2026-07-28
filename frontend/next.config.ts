import type { NextConfig } from "next";

import { getConfiguredBackendUrl } from "./lib/backend-url";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    const backendUrl = getConfiguredBackendUrl();

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
