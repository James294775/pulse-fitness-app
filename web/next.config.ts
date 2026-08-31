import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB. Raised for GPX/TCX uploads and long live-recording
      // point arrays (a multi-hour activity's track easily exceeds 1MB).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
