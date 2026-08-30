import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB. Raised for GPX/TCX uploads and long live-recording
      // point arrays (a multi-hour activity's track easily exceeds 1MB).
      bodySizeLimit: "10mb",
    },
  },
  // Demo-deploy-only: prisma/build-seed.db is created by vercel.json's
  // buildCommand, not imported by any JS, so Next's file tracer wouldn't
  // otherwise bundle it into the serverless function output. See
  // src/lib/db.ts for how it's used at runtime.
  outputFileTracingIncludes: {
    "/**": ["./prisma/build-seed.db"],
  },
};

export default nextConfig;
