import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typedRoutes: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT
          ? new URL(process.env.NEXT_PUBLIC_MINIO_ENDPOINT).hostname
          : "127.0.0.1",
        port: process.env.NEXT_PUBLIC_MINIO_ENDPOINT
          ? new URL(process.env.NEXT_PUBLIC_MINIO_ENDPOINT).port || "9000"
          : "9000",
        pathname: `/${process.env.NEXT_PUBLIC_MINIO_BUCKET || "college-connect"}/**`,
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
  },
};

export default nextConfig;
