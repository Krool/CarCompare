import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // For GitHub Pages - set this to your repo name if not using custom domain
  // basePath: "/CarCompare",
  // assetPrefix: "/CarCompare/",
};

export default nextConfig;
