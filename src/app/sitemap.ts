import { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://connect.nitap.ac.in";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/shops`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  try {
    const shops = await prisma.shop.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        updated_at: true,
      },
    });

    const shopPages: MetadataRoute.Sitemap = shops.map((shop) => ({
      url: `${baseUrl}/shops/${shop.id}`,
      lastModified: shop.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const products = await prisma.product.findMany({
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
      take: 5000,
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updated_at,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticPages, ...shopPages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticPages;
  }
}

export const revalidate = 3600;
