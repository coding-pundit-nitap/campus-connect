import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://connect.nitap.ac.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin/",
          "/owner-shops/",
          "/profile/",
          "/cart/",
          "/checkout/",
        ],
      },
      {
        userAgent: "*",
        allow: ["/product/", "/shops/", "/"],
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
  };
}
