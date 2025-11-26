import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // For GitHub Pages - repo name as base path
  basePath: "/CarCompare",
  assetPrefix: "/CarCompare/",
};

export default nextConfig;
