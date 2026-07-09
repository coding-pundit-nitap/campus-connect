import { MetadataRoute } from "next";

import { env } from "@/config/env.config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://connect.nitap.ac.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/owner-shops/",
          "/profile",
          "/orders/",
          "/favorites",
          "/notifications",
          "/checkout/",
          "/create-shop",
          "/search",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Google-Extended",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
