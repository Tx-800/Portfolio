import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Dev only: lets a phone on the local network load the dev server's assets (testing via
  // http://192.168.101.47:3000). Has no effect on production builds.
  allowedDevOrigins: ["192.168.101.47"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
