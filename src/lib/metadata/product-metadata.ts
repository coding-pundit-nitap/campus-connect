import { Metadata } from "next";
import { notFound } from "next/navigation";

import { productService } from "@/services/product/product.service";
export function getProductImageUrl(imageKey: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || "products";
  return `${baseUrl}/api/images/${bucket}/${imageKey}`;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function formatPriceForMetadata(
  price: string,
  discount?: string | null
): string {
  const priceNum = parseFloat(price);
  const discountNum = discount ? parseFloat(discount) : 0;

  if (discountNum > 0) {
    const finalPrice = priceNum - discountNum;
    return `₹${finalPrice.toFixed(2)} (${Math.round((discountNum / priceNum) * 100)}% off)`;
  }

  return `₹${priceNum.toFixed(2)}`;
}

export async function generateProductMetadata(
  productId: string
): Promise<Metadata> {
  const product = await productService.getProductById(productId);

  if (!product) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/product/${productId}`;
  const imageUrl = getProductImageUrl(product.image_key);

  const averageRating =
    product.review_count > 0
      ? (product.rating_sum / product.review_count).toFixed(1)
      : null;

  const priceDisplay = formatPriceForMetadata(
    product.price.toString(),
    product.discount?.toString()
  );

  const description =
    product.description ||
    `Buy ${product.name} from ${product.shop.name} at ${priceDisplay}. ${product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}.`;

  const metaDescription =
    description.length > 160
      ? description.substring(0, 157) + "..."
      : description;

  const title = `${product.name} - ${priceDisplay} | ${product.shop.name} | Campus Connect`;

  const keywords = [
    product.name,
    product.shop.name,
    product.category?.name || "Products",
    "Campus Connect",
    "Campus Shopping",
    "College Store",
  ].join(", ");

  return {
    title,
    description: metaDescription,
    keywords,
    authors: [{ name: product.shop.name }],
    creator: product.shop.name,
    publisher: "Campus Connect",
    category: product.category?.name || "Products",

    openGraph: {
      type: "website",
      url: productUrl,
      title,
      description,
      siteName: "Campus Connect",
      locale: "en_IN",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
          type: "image/jpeg",
        },
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
          type: "image/jpeg",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: [imageUrl],
      creator: "@campusconnect",
      site: "@campusconnect",
    },

    robots: {
      index: product.stock_quantity > 0,
      follow: true,
      googleBot: {
        index: product.stock_quantity > 0,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    alternates: {
      canonical: productUrl,
    },

    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": "INR",
      "product:availability": product.stock_quantity > 0 ? "instock" : "oos",
      "product:brand": product.shop.name,
      "product:condition": "new",
      ...(averageRating && {
        "product:rating": averageRating,
        "product:rating:count": product.review_count.toString(),
      }),
    },
  };
}

export function generateProductJsonLd(product: {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  discount?: number | string | null;
  image_key: string;
  rating_sum: number;
  review_count: number;
  stock_quantity: number;
  shop: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  } | null;
  created_at?: Date | string;
}) {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/product/${product.id}`;
  const imageUrl = getProductImageUrl(product.image_key);

  const priceNum =
    typeof product.price === "string"
      ? parseFloat(product.price)
      : product.price;
  const discountNum =
    typeof product.discount === "string"
      ? parseFloat(product.discount)
      : product.discount || 0;
  const finalPrice = priceNum - discountNum;

  const averageRating =
    product.review_count > 0
      ? (product.rating_sum / product.review_count).toFixed(1)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: product.name,
    description:
      product.description ||
      `${product.name} available at ${product.shop.name}`,
    image: [imageUrl],
    url: productUrl,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.shop.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: finalPrice.toFixed(2),
      priceValidUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: product.shop.name,
      },
    },
    ...(averageRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount: product.review_count,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(product.category && {
      category: product.category.name,
    }),
  };

  return jsonLd;
}
