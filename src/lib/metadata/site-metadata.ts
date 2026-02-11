import { Metadata } from "next";

export const siteConfig = {
  name: "Campus Connect",
  description:
    "Hyper-local e-commerce platform connecting campus vendors with students. Order from your favorite campus shops and get batch delivery to your hostel.",
  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://connect.nitap.ac.in",
  ogImage: "/og-image.png",
  locale: "en_IN",
};

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "campus shopping",
    "college delivery",
    "student marketplace",
    "hostel delivery",
    "campus vendors",
    "batch delivery",
    "NIT Arunachal Pradesh",
    "student food delivery",
    "campus e-commerce",
  ],
  authors: [{ name: "Campus Connect Team" }],
  creator: "Campus Connect",
  publisher: "Campus Connect",
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
};

export interface ShopMetadataProps {
  shop: {
    id: string;
    name: string;
    description: string;
    image_key: string;
  };
}

export function generateShopMetadata({ shop }: ShopMetadataProps): Metadata {
  const shopUrl = `${siteConfig.url}/shops/${shop.id}`;
  const imageUrl = `${siteConfig.url}/api/images/${process.env.NEXT_PUBLIC_MINIO_BUCKET || "shops"}/${shop.image_key}`;

  return {
    title: `${shop.name} - Campus Connect`,
    description: shop.description,
    openGraph: {
      type: "website",
      url: shopUrl,
      title: shop.name,
      description: shop.description,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: shop.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shop.name,
      description: shop.description,
      images: [imageUrl],
    },
    alternates: {
      canonical: shopUrl,
    },
  };
}

export function generateShopJsonLd(shop: {
  id: string;
  name: string;
  description: string;
  image_key: string;
  location?: string;
}) {
  const shopUrl = `${siteConfig.url}/shops/${shop.id}`;
  const imageUrl = `${siteConfig.url}/api/images/${process.env.NEXT_PUBLIC_MINIO_BUCKET || "shops"}/${shop.image_key}`;

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": shopUrl,
    name: shop.name,
    description: shop.description,
    image: imageUrl,
    url: shopUrl,
    ...(shop.location && {
      address: {
        "@type": "PostalAddress",
        addressLocality: shop.location,
      },
    }),
  };
}

export function generateBreadcrumbJsonLd(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteConfig.url}${crumb.url}`,
    })),
  };
}
