import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/ingredients/optimized/:path*", "/images/optimized/:path*"].map(source => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
  },
};

export default nextConfig;
