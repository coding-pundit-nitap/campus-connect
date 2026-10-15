import { buildFile, buildUser } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRepository,
  categoryServices,
  fileUploadService,
  notificationService,
  shopRepository,
  userRepository,
} from "@/di/container";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import { shopActionSchema } from "@/validations/shop";

import {
  createShopAction,
  deleteShopAction,
  toggleAcceptingOrdersAction,
  updateShopAction,
} from "./shop-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/validations/shop", () => ({
  shopActionSchema: {
    safeParse: vi.fn((data: unknown) => ({ success: true, data })),
  },
}));

const auth = vi.mocked(authUtils);
const shops = vi.mocked(shopRepository);
const uploads = vi.mocked(fileUploadService);

const form = (overrides: Record<string, unknown> = {}) =>
  ({
    name: "Shop",
    description: "Snacks",
    location: "Hall A",
    opening: "09:00",
    closing: "21:00",
    upi_id: "shop@upi",
    min_order_value: 50,
    default_delivery_fee: 10,
    direct_delivery_fee: 20,
    ...overrides,
  }) as never;

const newShop = { id: "shop-9", name: "Shop", min_order_value: "50" };

describe("shop-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    auth.getUserData.mockResolvedValue(buildUser({ shop_id: null }) as never);
    uploads.uploadOptimizedImage.mockImplementation(
      async (name: string) => ({ key: `key-${name}` }) as never
    );
    uploads.upload.mockImplementation(async (name: string) => `up-${name}`);
    uploads.deleteFile.mockResolvedValue();
  });

  describe("createShopAction", () => {
    beforeEach(() => {
      shops.findByOwnerId.mockResolvedValue(null);
      shops.create.mockResolvedValue(newShop as never);
    });

    it("creates the shop for the current user", async () => {
      const res = await createShopAction(form());

      expect(shops.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Shop",
          image_key: "",
          qr_image_key: "",
          batch_min_order_value: null,
          user: { connect: { id: "user-1" } },
        }),
      });
      expect(batchRepository.createManySlots).not.toHaveBeenCalled();
      expect(res.data).toEqual(newShop);
      expect(res.details).toMatch(/^Shop created successfully!/);
    });

    it("uploads both images and saves the batch slots", async () => {
      await createShopAction(
        form({
          image: buildFile("logo.png"),
          qr_image: buildFile("qr.png"),
          batch_min_order_value: 100,
          batch_slots: [
            { cutoff_time_minutes: 600, label: "  Lunch " },
            { cutoff_time_minutes: 900, label: "  " },
          ],
        })
      );

      expect(uploads.uploadOptimizedImage).toHaveBeenCalledWith(
        "logo.png",
        "image/png",
        3,
        expect.any(Buffer),
        { prefix: "shop-images" }
      );
      expect(shops.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          image_key: "key-logo.png",
          qr_image_key: "key-qr.png",
          batch_min_order_value: 100,
        }),
      });
      expect(batchRepository.createManySlots).toHaveBeenCalledWith([
        {
          shop_id: "shop-9",
          cutoff_time_minutes: 600,
          label: "Lunch",
          is_active: true,
          sort_order: 0,
        },
        {
          shop_id: "shop-9",
          cutoff_time_minutes: 900,
          label: null,
          is_active: true,
          sort_order: 1,
        },
      ]);
    });

    it("still succeeds, with a warning, when the batch slots cannot be saved", async () => {
      vi.mocked(batchRepository.createManySlots).mockRejectedValue(
        new Error("no table")
      );

      const res = await createShopAction(
        form({ batch_slots: [{ cutoff_time_minutes: 600 }] })
      );

      expect(res.success).toBe(true);
      expect(res.details).toMatch(/batch cards could not be saved/);
    });

    it("deletes uploaded files when creation fails", async () => {
      shops.create.mockRejectedValue(new Error("db"));
      uploads.deleteFile
        .mockRejectedValueOnce(new Error("s3"))
        .mockResolvedValueOnce();

      await expect(
        createShopAction(
          form({ image: buildFile("a.png"), qr_image: buildFile("b.png") })
        )
      ).rejects.toThrow(new InternalServerError("Failed to create shop."));
      expect(uploads.deleteFile).toHaveBeenCalledWith("key-a.png");
      expect(uploads.deleteFile).toHaveBeenCalledWith("key-b.png");
    });

    it.each([
      [
        "the session has no user id",
        () =>
          auth.getUserData.mockResolvedValue(buildUser({ id: "" }) as never),
        UnauthorizedError,
      ],
      [
        "the user is already linked to a shop",
        () => auth.getUserData.mockResolvedValue(buildUser() as never),
        BadRequestError,
      ],
      [
        "the user already owns a shop",
        () => shops.findByOwnerId.mockResolvedValue({ id: "s" } as never),
        BadRequestError,
      ],
      [
        "the form is invalid",
        () =>
          vi.mocked(shopActionSchema.safeParse).mockReturnValue({
            success: false,
            error: { message: "bad" },
          } as never),
        BadRequestError,
      ],
    ])("rejects when %s", async (_case, arrange, ErrorType) => {
      arrange();

      await expect(createShopAction(form())).rejects.toBeInstanceOf(ErrorType);
      expect(shops.create).not.toHaveBeenCalled();
    });
  });

  describe("updateShopAction", () => {
    beforeEach(() => {
      shops.findByOwnerId.mockResolvedValue({
        id: "shop-1",
        image_key: "old-img",
        qr_image_key: "old-qr",
      } as never);
      shops.update.mockResolvedValue({ id: "shop-1", name: "Shop" } as never);
    });

    it("updates the shop and notifies the owner", async () => {
      const res = await updateShopAction(form());

      expect(categoryServices.cleanupEmptyCategories).toHaveBeenCalled();
      expect(shops.update).toHaveBeenCalledWith(
        "shop-1",
        expect.not.objectContaining({ batch_slots: expect.anything() })
      );
      expect(uploads.deleteFile).not.toHaveBeenCalled();
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ title: "Shop Updated Successfully" })
      );
      expect(res.details).toBe("Shop updated successfully!");
    });

    it("replaces images and batch slots", async () => {
      await updateShopAction(
        form({
          image: buildFile("a.png"),
          qr_image: buildFile("b.png"),
          batch_slots: [{ cutoff_time_minutes: 60, label: "Early" }],
        })
      );

      expect(uploads.deleteFile).toHaveBeenCalledWith("old-img");
      expect(uploads.deleteFile).toHaveBeenCalledWith("old-qr");
      expect(shops.update).toHaveBeenCalledWith(
        "shop-1",
        expect.objectContaining({
          image_key: "up-a.png",
          qr_image_key: "up-b.png",
          batch_slots: {
            deleteMany: {},
            create: [
              {
                cutoff_time_minutes: 60,
                label: "Early",
                is_active: true,
                sort_order: 0,
              },
            ],
          },
        })
      );
    });

    it("does not delete anything when the shop had no previous images", async () => {
      shops.findByOwnerId.mockResolvedValue({ id: "shop-1" } as never);

      await updateShopAction(
        form({ image: buildFile("a.png"), qr_image: buildFile("b.png") })
      );

      expect(uploads.deleteFile).not.toHaveBeenCalled();
    });

    it("rejects a user who owns no shop as unauthorized", async () => {
      shops.findByOwnerId.mockResolvedValue(null);

      await expect(updateShopAction(form())).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(shops.update).not.toHaveBeenCalled();
    });

    it("surfaces an invalid form as a BadRequestError", async () => {
      vi.mocked(shopActionSchema.safeParse).mockReturnValue({
        success: false,
        error: { message: "bad" },
      } as never);

      await expect(updateShopAction(form())).rejects.toThrow(
        new BadRequestError("bad")
      );
    });

    it("never takes image keys from the client", async () => {
      await updateShopAction(
        form({ image_key: "other-shop-img", qr_image_key: "other-shop-qr" })
      );

      const data = vi.mocked(shops.update).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      expect(data.image_key).not.toBe("other-shop-img");
      expect(data.qr_image_key).not.toBe("other-shop-qr");
    });
  });

  describe("deleteShopAction", () => {
    it("deletes images, the shop and the owner link", async () => {
      shops.findByOwnerId.mockResolvedValue({
        id: "shop-1",
        image_key: "img",
        qr_image_key: "qr",
      } as never);
      uploads.deleteFile.mockRejectedValueOnce(new Error("s3"));

      const res = await deleteShopAction();

      expect(uploads.deleteFile).toHaveBeenCalledWith("img");
      expect(uploads.deleteFile).toHaveBeenCalledWith("qr");
      expect(shops.delete).toHaveBeenCalledWith("shop-1");
      expect(userRepository.update).toHaveBeenCalledWith("user-1", {
        owned_shop: { disconnect: true },
      });
      expect(res.details).toBe("Shop deleted successfully");
    });

    it("skips image deletion when there are no images", async () => {
      shops.findByOwnerId.mockResolvedValue({ id: "shop-1" } as never);

      await deleteShopAction();

      expect(uploads.deleteFile).not.toHaveBeenCalled();
      expect(shops.delete).toHaveBeenCalledWith("shop-1");
    });

    it("rejects a user who owns no shop as unauthorized", async () => {
      shops.findByOwnerId.mockResolvedValue(null);

      await expect(deleteShopAction()).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(shops.delete).not.toHaveBeenCalled();
    });
  });

  describe("toggleAcceptingOrdersAction", () => {
    beforeEach(() => {
      shops.findByOwnerId.mockResolvedValue({
        id: "shop-1",
        is_active: true,
      } as never);
    });

    it.each([
      [true, "Shop is now accepting orders"],
      [false, "Shop is now paused - no new orders will be accepted"],
    ])("sets accepting_orders to %s", async (accepting, message) => {
      const res = await toggleAcceptingOrdersAction(accepting);

      expect(shops.update).toHaveBeenCalledWith("shop-1", {
        accepting_orders: accepting,
      });
      expect(res).toMatchObject({
        data: { accepting_orders: accepting },
        details: message,
      });
    });

    it.each([
      [
        "the session has no user id",
        () =>
          auth.getUserData.mockResolvedValue(buildUser({ id: "" }) as never),
        new UnauthorizedError("User is not authorized"),
      ],
      [
        "the user has no shop",
        () => shops.findByOwnerId.mockResolvedValue(null),
        new UnauthorizedError("You don't have a shop to update"),
      ],
      [
        "the shop is deactivated",
        () =>
          shops.findByOwnerId.mockResolvedValue({
            id: "shop-1",
            is_active: false,
          } as never),
        new BadRequestError(
          "Cannot toggle orders - your shop is deactivated by admin"
        ),
      ],
      [
        "the update fails",
        () => shops.update.mockRejectedValue(new Error("db")),
        new InternalServerError("Failed to toggle order acceptance."),
      ],
    ])("throws when %s", async (_case, arrange, expected) => {
      arrange();

      const promise = toggleAcceptingOrdersAction(true);

      await expect(promise).rejects.toBeInstanceOf(expected.constructor);
      await expect(promise).rejects.toThrow(expected.message);
    });
  });
});
