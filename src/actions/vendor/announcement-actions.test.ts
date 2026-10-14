import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  getAnnouncementsAction,
  getShopAnnouncementsAction,
} from "./announcement-actions";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;
const created = new Date("2026-01-01T00:00:00.000Z");
const expires = new Date("2026-01-02T00:00:00.000Z");
const future = () => new Date(Date.now() + 3_600_000);

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "a1",
  shop_id: "shop-1",
  shop: { name: "Shop", shop_type: "FOOD" },
  title: "Sale",
  message: "50% off",
  image_key: null,
  expires_at: expires,
  created_at: created,
  product: null,
  ...overrides,
});

describe("announcement-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
  });

  describe("getAnnouncementsAction", () => {
    it("serializes active announcements with their products", async () => {
      db.shopAnnouncement.findMany.mockResolvedValue([
        row(),
        row({
          id: "a2",
          product: {
            id: "p1",
            name: "Chips",
            price: "20.5",
            discount: "10",
            stock_quantity: 3,
            image_key: "img",
            brand: { name: "Lays" },
            is_veg: true,
          },
        }),
        row({
          id: "a3",
          product: {
            id: "p2",
            name: "Cola",
            price: 5,
            discount: null,
            stock_quantity: 0,
            image_key: "img2",
            brand: null,
            is_veg: null,
          },
        }),
      ]);

      const res = await getAnnouncementsAction();

      expect(db.shopAnnouncement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { expires_at: { gt: expect.any(Date) } },
          orderBy: { created_at: "desc" },
        })
      );
      expect(res.data[0]).toEqual({
        id: "a1",
        shop_id: "shop-1",
        shop_name: "Shop",
        shop_type: "FOOD",
        title: "Sale",
        message: "50% off",
        image_key: null,
        expires_at: expires.toISOString(),
        created_at: created.toISOString(),
        product: null,
      });
      expect(res.data[1].product).toEqual({
        id: "p1",
        name: "Chips",
        price: 20.5,
        discount: 10,
        stock_quantity: 3,
        image_key: "img",
        brand: "Lays",
        is_veg: true,
      });
      expect(res.data[2].product).toMatchObject({
        discount: null,
        brand: null,
      });
    });

    it("rethrows a database error as a plain Error with its message", async () => {
      db.shopAnnouncement.findMany.mockRejectedValue(new Error("db down"));

      await expect(getAnnouncementsAction()).rejects.toThrow("db down");
    });

    it("uses a default message for non-Error failures", async () => {
      db.shopAnnouncement.findMany.mockRejectedValue("boom");

      await expect(getAnnouncementsAction()).rejects.toThrow(
        "Failed to retrieve announcements"
      );
    });
  });

  describe("createAnnouncementAction", () => {
    const input = () => ({
      title: " Sale ",
      message: " Big ",
      expires_at: future(),
    });

    it("publishes a trimmed announcement", async () => {
      db.shopAnnouncement.create.mockResolvedValue({ id: "a1" });
      const data = input();

      const res = await createAnnouncementAction(data);

      expect(db.product.findUnique).not.toHaveBeenCalled();
      expect(db.shopAnnouncement.create).toHaveBeenCalledWith({
        data: {
          shop_id: "shop-1",
          title: "Sale",
          message: "Big",
          expires_at: data.expires_at,
          product_id: undefined,
        },
      });
      expect(res).toMatchObject({
        data: { id: "a1" },
        details: "Announcement published successfully!",
      });
    });

    it("links one of the shop's own products", async () => {
      db.product.findUnique.mockResolvedValue({
        shop_id: "shop-1",
        deleted_at: null,
      });

      await createAnnouncementAction({ ...input(), product_id: "p1" });

      expect(db.shopAnnouncement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ product_id: "p1" }),
      });
    });

    it.each([
      [null],
      [{ shop_id: "shop-1", deleted_at: new Date() }],
      [{ shop_id: "other", deleted_at: null }],
    ])("rejects an unusable product %o", async (product) => {
      db.product.findUnique.mockResolvedValue(product);

      await expect(
        createAnnouncementAction({ ...input(), product_id: "p1" })
      ).rejects.toThrow(
        "Invalid product: Product does not exist or belongs to another shop."
      );
    });

    it.each([
      [{ title: "  " }, "Title is required"],
      [{ title: "" }, "Title is required"],
      [{ message: " " }, "Message is required"],
      [{ message: "" }, "Message is required"],
      [
        { expires_at: new Date(Date.now() - 1000) },
        "Expiration time must be in the future",
      ],
    ])("validates %o", async (overrides, message) => {
      await expect(
        createAnnouncementAction({ ...input(), ...overrides })
      ).rejects.toThrow(new ValidationError(message));
    });
  });

  describe("deleteAnnouncementAction", () => {
    it("deletes the shop's own announcement", async () => {
      db.shopAnnouncement.findUnique.mockResolvedValue({ shop_id: "shop-1" });

      const res = await deleteAnnouncementAction("a1");

      expect(db.shopAnnouncement.delete).toHaveBeenCalledWith({
        where: { id: "a1" },
      });
      expect(res.details).toBe("Announcement deleted successfully");
    });

    it.each([[null], [{ shop_id: "other" }]])(
      "rejects a missing or foreign announcement %o",
      async (found) => {
        db.shopAnnouncement.findUnique.mockResolvedValue(found);

        await expect(deleteAnnouncementAction("a1")).rejects.toThrow(
          new ValidationError("Announcement not found or unauthorized")
        );
        expect(db.shopAnnouncement.delete).not.toHaveBeenCalled();
      }
    );
  });

  describe("getShopAnnouncementsAction", () => {
    it("serializes the shop's announcements", async () => {
      db.shopAnnouncement.findMany.mockResolvedValue([
        row({ product: { name: "Chips" } }),
        row({ id: "a2" }),
      ]);

      const res = await getShopAnnouncementsAction();

      expect(db.shopAnnouncement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shop_id: "shop-1" } })
      );
      expect(res.data).toEqual([
        {
          id: "a1",
          title: "Sale",
          message: "50% off",
          expires_at: expires.toISOString(),
          created_at: created.toISOString(),
          product_name: "Chips",
        },
        expect.objectContaining({ id: "a2", product_name: null }),
      ]);
    });
  });

  it.each([
    [
      "createAnnouncementAction",
      () =>
        createAnnouncementAction({
          title: "t",
          message: "m",
          expires_at: future(),
        }),
    ],
    ["deleteAnnouncementAction", () => deleteAnnouncementAction("a1")],
    ["getShopAnnouncementsAction", () => getShopAnnouncementsAction()],
  ])("%s requires a shop owner", async (_name, act) => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expect(act()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
