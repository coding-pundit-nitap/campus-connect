import { MetadataRoute } from "next";

import { env } from "@/config/env.config";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://connect.nitap.ac.in";

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shops`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const [shops, products] = await Promise.all([
      prisma.shop.findMany({
        where: {
          is_active: true,
          deleted_at: null,
        },
        select: {
          id: true,
          updated_at: true,
        },
      }),

      prisma.product.findMany({
        where: {
          deleted_at: null,
          shop: {
            is_active: true,
            deleted_at: null,
          },
        },
        select: {
          id: true,
          updated_at: true,
        },
      }),
    ]);

    const shopPages: MetadataRoute.Sitemap = shops.map((shop) => ({
      url: `${baseUrl}/shops/${shop.id}`,
      lastModified: shop.updated_at,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...shopPages, ...productPages];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("Failed to generate sitemap:", error);
    return staticPages;
  }
}
