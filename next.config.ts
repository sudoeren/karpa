import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    workerThreads: false,
  },
};

export default nextConfig;
