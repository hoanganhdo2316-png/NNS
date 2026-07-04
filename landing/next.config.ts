import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // bắt buộc với static export — Image Optimization API không khả dụng
  },
};

export default nextConfig;
