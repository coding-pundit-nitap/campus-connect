import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ env: {} as Record<string, unknown> }));

vi.mock("@/config/env.config", () => envMock);

const load = async () => import("./site-metadata");

const shop = {
  id: "shop-1",
  name: "Canteen",
  description: "Hot food",
  image_key: "canteen.jpg",
};

describe("site-metadata", () => {
  beforeEach(() => {
    vi.resetModules();
    envMock.env.NEXT_PUBLIC_APP_URL = "https://campus.test";
    envMock.env.NEXT_PUBLIC_MINIO_BUCKET = "bucket";
  });

  describe("siteConfig / defaultMetadata", () => {
    it("uses the configured app URL", async () => {
      const { siteConfig, defaultMetadata } = await load();

      expect(siteConfig.url).toBe("https://campus.test");
      expect(defaultMetadata.metadataBase).toEqual(
        new URL("https://campus.test")
      );
      expect(defaultMetadata.title).toEqual({
        default: "Campus Connect",
        template: "%s | Campus Connect",
      });
    });

    it("falls back to the production domain", async () => {
      envMock.env.NEXT_PUBLIC_APP_URL = "";

      const { siteConfig } = await load();

      expect(siteConfig.url).toBe("https://connect.nitap.ac.in");
    });
  });

  describe("generateShopMetadata", () => {
    it("builds canonical, open-graph and twitter metadata", async () => {
      const { generateShopMetadata } = await load();

      const meta = generateShopMetadata({ shop });

      expect(meta).toMatchObject({
        title: "Canteen - Campus Connect",
        description: "Hot food",
        alternates: { canonical: "https://campus.test/shops/shop-1" },
        twitter: {
          images: ["https://campus.test/api/images/bucket/canteen.jpg"],
        },
      });
    });

    it("falls back to the shops bucket", async () => {
      envMock.env.NEXT_PUBLIC_MINIO_BUCKET = "";
      const { generateShopMetadata } = await load();

      const meta = generateShopMetadata({ shop });

      expect(meta.twitter).toMatchObject({
        images: ["https://campus.test/api/images/shops/canteen.jpg"],
      });
    });
  });

  describe("generateShopJsonLd", () => {
    it("includes an address when a location is given", async () => {
      const { generateShopJsonLd } = await load();

      const ld = generateShopJsonLd({ ...shop, location: "Block A" });

      expect(ld).toMatchObject({
        "@type": "Store",
        "@id": "https://campus.test/shops/shop-1",
        image: "https://campus.test/api/images/bucket/canteen.jpg",
        address: { "@type": "PostalAddress", addressLocality: "Block A" },
      });
    });

    it("omits the address without a location and falls back to the shops bucket", async () => {
      envMock.env.NEXT_PUBLIC_MINIO_BUCKET = "";
      const { generateShopJsonLd } = await load();

      const ld = generateShopJsonLd(shop);

      expect(ld).not.toHaveProperty("address");
      expect(ld.image).toBe("https://campus.test/api/images/shops/canteen.jpg");
    });
  });

  describe("generateBreadcrumbJsonLd", () => {
    it("numbers crumbs from 1 and prefixes the site URL", async () => {
      const { generateBreadcrumbJsonLd } = await load();

      const ld = generateBreadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Shops", url: "/shops" },
      ]);

      expect(ld.itemListElement).toEqual([
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://campus.test/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shops",
          item: "https://campus.test/shops",
        },
      ]);
    });
  });
});
