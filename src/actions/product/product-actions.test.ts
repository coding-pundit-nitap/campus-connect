import { buildFile, buildProduct } from "@tests/helpers/actions-user/builders";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  brandRepository,
  cartRepository,
  categoryRepository,
  fileUploadService,
  notificationService,
  productRepository,
  shopRepository,
} from "@/di/container";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import { notifyStockWatchers } from "@/services/notification/stock-watch-notification.service";
import {
  productActionSchema,
  productUpdateActionSchema,
} from "@/validations/product";

import {
  bulkCreateProductsAction,
  createProductAction,
  deleteProductAction,
  toggleProductStockAction,
  updateProductAction,
  updateProductPriceAction,
} from "./product-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils", () => ({
  serializeProduct: vi.fn((p: { id: string }) => ({ serialized: p.id })),
}));
vi.mock("@/services/notification/stock-watch-notification.service", () => ({
  notifyStockWatchers: vi.fn(),
}));
vi.mock("@/validations/product", () => ({
  productActionSchema: { parse: vi.fn((d: unknown) => d) },
  productUpdateActionSchema: { parse: vi.fn((d: unknown) => d) },
}));

const auth = vi.mocked(authUtils);
const products = vi.mocked(productRepository);
const categories = vi.mocked(categoryRepository);
const brands = vi.mocked(brandRepository);
const uploads = vi.mocked(fileUploadService);

const formData = (overrides: Record<string, unknown> = {}) =>
  ({
    name: "Chips",
    price: 20,
    stock_quantity: 3,
    description: "Crunchy",
    discount: 0,
    category: "Snacks",
    brand: "Lays",
    ...overrides,
  }) as never;

describe("product-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    vi.mocked(shopRepository.findByOwnerId).mockResolvedValue({
      id: "shop-1",
    } as never);
    categories.findOrCreate.mockResolvedValue({ id: "cat-2" } as never);
    brands.findOrCreate.mockResolvedValue({ id: "brand-2" } as never);
    uploads.uploadOptimizedImage.mockResolvedValue({
      key: "new-key",
      compressionRatio: 40,
    } as never);
    products.create.mockResolvedValue(buildProduct() as never);
    products.update.mockResolvedValue(buildProduct() as never);
  });

  describe("createProductAction", () => {
    it("creates the product in the owner's shop without an image", async () => {
      const res = await createProductAction(formData());

      expect(productActionSchema.parse).toHaveBeenCalled();
      expect(uploads.uploadOptimizedImage).not.toHaveBeenCalled();
      expect(products.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          image_key: "",
          name: "Chips",
          shop: { connect: { id: "shop-1" } },
          category: { connect: { id: "cat-2" } },
          brand: { connect: { id: "brand-2" } },
        }),
        include: expect.objectContaining({ category: true, brand: true }),
      });
      expect(revalidatePath).toHaveBeenCalledWith("/shops/shop-1");
      expect(res).toMatchObject({
        data: { serialized: "product-1" },
        details: "Product created successfully",
      });
    });

    it("uploads the image and stores its key", async () => {
      await createProductAction(formData({ image: buildFile() }));

      expect(uploads.uploadOptimizedImage).toHaveBeenCalledWith(
        "pic.png",
        "image/png",
        3,
        expect.any(Buffer),
        { prefix: "product-images" }
      );
      expect(products.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ image_key: "new-key" }),
        })
      );
    });

    it("deletes the uploaded image when creation fails", async () => {
      products.create.mockRejectedValue(new Error("db"));

      await expect(
        createProductAction(formData({ image: buildFile() }))
      ).rejects.toThrow(new InternalServerError("Failed to create product."));
      expect(uploads.deleteFile).toHaveBeenCalledWith("new-key");
    });

    it("still reports the original failure when the cleanup fails", async () => {
      products.create.mockRejectedValue(new Error("db"));
      uploads.deleteFile.mockRejectedValue(new Error("s3"));

      await expect(
        createProductAction(formData({ image: buildFile() }))
      ).rejects.toThrow("Failed to create product.");
    });

    it("rejects a user without a shop as unauthorized, without any cleanup", async () => {
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(createProductAction(formData())).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(uploads.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe("updateProductAction", () => {
    const current = (overrides: Record<string, unknown> = {}) =>
      buildProduct({ stock_quantity: 0, ...overrides }) as never;

    beforeEach(() => {
      products.findById.mockResolvedValue(current());
      products.update.mockResolvedValue(
        buildProduct({ stock_quantity: 4 }) as never
      );
    });

    it("updates the product, reconnects category/brand and cleans up old ones", async () => {
      const res = await updateProductAction("product-1", formData());

      expect(productUpdateActionSchema.parse).toHaveBeenCalled();
      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({
          image_key: "old-key",
          category: { connect: { id: "cat-2" } },
          brand: { connect: { id: "brand-2" } },
        }),
        { include: expect.objectContaining({ category: true }) }
      );
      expect(notifyStockWatchers).toHaveBeenCalledWith(
        "product-1",
        "Chips",
        "Shop"
      );
      expect(categories.deleteIfEmpty).toHaveBeenCalledWith("cat-1");
      expect(brands.deleteIfEmpty).toHaveBeenCalledWith("brand-1");
      expect(revalidatePath).toHaveBeenCalledWith("/shops/shop-1");
      expect(res.details).toBe("Product updated successfully");
    });

    it("disconnects category and brand when they are cleared", async () => {
      products.findById.mockResolvedValue(
        current({ category_id: null, brand_id: null, image_key: null })
      );

      await updateProductAction(
        "product-1",
        formData({ category: "", brand: "" })
      );

      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({
          image_key: "",
          category: { disconnect: true },
          brand: { disconnect: true },
        }),
        expect.anything()
      );
      expect(categories.deleteIfEmpty).not.toHaveBeenCalled();
      expect(brands.deleteIfEmpty).not.toHaveBeenCalled();
    });

    it("keeps category and brand that did not change", async () => {
      categories.findOrCreate.mockResolvedValue({ id: "cat-1" } as never);
      brands.findOrCreate.mockResolvedValue({ id: "brand-1" } as never);

      await updateProductAction("product-1", formData());

      expect(categories.deleteIfEmpty).not.toHaveBeenCalled();
      expect(brands.deleteIfEmpty).not.toHaveBeenCalled();
    });

    it("ignores a client-supplied image_key and keeps the stored one", async () => {
      await updateProductAction("product-1", formData({ image_key: "given" }));

      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({ image_key: "old-key" }),
        expect.anything()
      );
    });

    it("uploads a new image and deletes the replaced one", async () => {
      await updateProductAction("product-1", formData({ image: buildFile() }));

      expect(uploads.deleteFile).toHaveBeenCalledWith("old-key");
      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({ image_key: "new-key" }),
        expect.anything()
      );
    });

    it.each([
      ["there was no previous image", { image_key: null }],
      ["the key did not change", { image_key: "new-key" }],
    ])("does not delete anything when %s", async (_case, overrides) => {
      products.findById.mockResolvedValue(current(overrides));

      await updateProductAction("product-1", formData({ image: buildFile() }));

      expect(uploads.deleteFile).not.toHaveBeenCalled();
    });

    it("does not notify watchers when the product was already in stock", async () => {
      products.findById.mockResolvedValue(current({ stock_quantity: 2 }));

      await updateProductAction("product-1", formData());

      expect(notifyStockWatchers).not.toHaveBeenCalled();
    });

    it("does not notify watchers when the product stays out of stock", async () => {
      products.update.mockResolvedValue(
        buildProduct({ stock_quantity: 0 }) as never
      );

      await updateProductAction("product-1", formData());

      expect(notifyStockWatchers).not.toHaveBeenCalled();
    });

    it("treats a missing stock quantity as out of stock", async () => {
      products.findById.mockResolvedValue(current({ stock_quantity: null }));

      await updateProductAction("product-1", formData());

      expect(notifyStockWatchers).toHaveBeenCalled();
    });

    it.each([
      [
        "the user owns no shop",
        () => vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null),
        UnauthorizedError,
      ],
      [
        "the product is missing",
        () => products.findById.mockResolvedValue(null),
        ForbiddenError,
      ],
      [
        "the product is another shop's",
        () => products.findById.mockResolvedValue(current({ shop_id: "x" })),
        ForbiddenError,
      ],
      [
        "validation fails",
        () =>
          vi.mocked(productUpdateActionSchema.parse).mockImplementation(() => {
            throw new ValidationError("bad");
          }),
        ValidationError,
      ],
      [
        "the update fails",
        () => products.update.mockRejectedValue(new Error("db")),
        InternalServerError,
      ],
    ])("throws when %s", async (_case, arrange, ErrorType) => {
      arrange();

      await expect(
        updateProductAction("product-1", formData())
      ).rejects.toBeInstanceOf(ErrorType);
    });
  });

  describe("deleteProductAction", () => {
    beforeEach(() => {
      products.findById.mockResolvedValue(buildProduct() as never);
      vi.mocked(cartRepository.getUserIdsByProductInCart).mockResolvedValue([
        "u1",
        "u2",
      ]);
      vi.mocked(notificationService.publishNotification).mockResolvedValue();
    });

    it("notifies cart holders, deletes the product and empty category/brand", async () => {
      const res = await deleteProductAction("product-1");

      expect(notificationService.publishNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({ title: "Item Removed from Cart" })
      );
      expect(products.delete).toHaveBeenCalledWith("product-1");
      expect(categories.deleteIfEmpty).toHaveBeenCalledWith("cat-1");
      expect(brands.deleteIfEmpty).toHaveBeenCalledWith("brand-1");
      expect(res).toMatchObject({ data: null });
    });

    it("deletes the product even when notifying a user fails", async () => {
      vi.mocked(notificationService.publishNotification).mockRejectedValue(
        new Error("queue")
      );

      await deleteProductAction("product-1");

      expect(products.delete).toHaveBeenCalled();
    });

    it("skips category/brand cleanup when the product had none", async () => {
      products.findById.mockResolvedValue(
        buildProduct({ category_id: null, brand_id: null }) as never
      );

      await deleteProductAction("product-1");

      expect(categories.deleteIfEmpty).not.toHaveBeenCalled();
      expect(brands.deleteIfEmpty).not.toHaveBeenCalled();
    });

    it.each([
      [
        "the user owns no shop",
        () => vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null),
        UnauthorizedError,
      ],
      [
        "the product does not exist",
        () => products.findById.mockResolvedValue(null),
        InternalServerError,
      ],
      [
        "the product is another shop's",
        () =>
          products.findById.mockResolvedValue(
            buildProduct({ shop_id: "x" }) as never
          ),
        ForbiddenError,
      ],
    ])("throws when %s", async (_case, arrange, ErrorType) => {
      arrange();

      await expect(deleteProductAction("product-1")).rejects.toBeInstanceOf(
        ErrorType
      );
      expect(products.delete).not.toHaveBeenCalled();
    });
  });

  describe("bulkCreateProductsAction", () => {
    it("creates each product with trimmed optional category and brand", async () => {
      products.create
        .mockResolvedValueOnce({ id: "p1", name: "Chips" } as never)
        .mockResolvedValueOnce({ id: "p2", name: "Cola" } as never);

      const res = await bulkCreateProductsAction([
        {
          name: "Chips",
          price: 10,
          stock_quantity: 1,
          category: " Snacks ",
          brand: " Lays ",
        },
        { name: "Cola", price: 5, stock_quantity: 2, description: "Fizzy" },
      ]);

      expect(categories.findOrCreate).toHaveBeenCalledWith("Snacks");
      expect(brands.findOrCreate).toHaveBeenCalledWith("Lays");
      expect(products.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          description: "",
          image_key: "placeholder",
          category: { connect: { id: "cat-2" } },
          brand: { connect: { id: "brand-2" } },
        }),
      });
      const second = products.create.mock.calls[1][0] as {
        data: Record<string, unknown>;
      };
      expect(second.data).not.toHaveProperty("category");
      expect(second.data).not.toHaveProperty("brand");
      expect(second.data.description).toBe("Fizzy");
      expect(res).toMatchObject({
        data: {
          created: 2,
          products: [
            { id: "p1", name: "Chips" },
            { id: "p2", name: "Cola" },
          ],
        },
        details: "Successfully created 2 products",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/shops/shop-1");
    });

    it("joins every schema violation into a ValidationError", async () => {
      await expect(
        bulkCreateProductsAction([{ name: "ab", price: -1, stock_quantity: 0 }])
      ).rejects.toThrow(
        new ValidationError(
          "Name is too short, Price must be a positive number"
        )
      );
      expect(products.create).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty list", []],
      [
        "more than 50 products",
        Array.from({ length: 51 }, () => ({
          name: "Chips",
          price: 1,
          stock_quantity: 1,
        })),
      ],
    ])("rejects %s", async (_case, list) => {
      await expect(bulkCreateProductsAction(list)).rejects.toThrow(
        new InternalServerError("Failed to create products")
      );
    });

    it("rejects a user without a shop", async () => {
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(bulkCreateProductsAction([])).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("toggleProductStockAction", () => {
    beforeEach(() => {
      products.findById.mockResolvedValue(
        buildProduct({ stock_quantity: 0 }) as never
      );
      products.update.mockResolvedValue(
        buildProduct({ stock_quantity: 99 }) as never
      );
    });

    it("restocks the product and notifies watchers", async () => {
      const res = await toggleProductStockAction("product-1", true);

      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        { stock_quantity: 99 },
        expect.anything()
      );
      expect(notifyStockWatchers).toHaveBeenCalledWith(
        "product-1",
        "Chips",
        "Shop"
      );
      expect(revalidatePath).toHaveBeenCalledWith("/shops/shop-1");
      expect(res).toMatchObject({
        data: { serialized: "product-1" },
        details: "Stock toggled successfully.",
      });
    });

    it("marks the product out of stock without notifying", async () => {
      products.update.mockResolvedValue(
        buildProduct({ stock_quantity: 0 }) as never
      );

      await toggleProductStockAction("product-1", false);

      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        { stock_quantity: 0 },
        expect.anything()
      );
      expect(notifyStockWatchers).not.toHaveBeenCalled();
    });

    it("does not notify when the product was already in stock", async () => {
      products.findById.mockResolvedValue(buildProduct() as never);

      await toggleProductStockAction("product-1", true);

      expect(notifyStockWatchers).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty id", "", true, BadRequestError],
      ["a non-boolean state", "product-1", "yes", BadRequestError],
    ])("rejects %s", async (_case, id, state, ErrorType) => {
      await expect(
        toggleProductStockAction(id, state as boolean)
      ).rejects.toBeInstanceOf(ErrorType);
    });
  });

  describe("updateProductPriceAction", () => {
    beforeEach(() => {
      products.findById.mockResolvedValue(buildProduct() as never);
    });

    it("updates the price", async () => {
      const res = await updateProductPriceAction("product-1", 12.5);

      expect(products.update).toHaveBeenCalledWith(
        "product-1",
        { price: 12.5 },
        expect.anything()
      );
      expect(res.details).toBe("Price updated successfully.");
    });

    it.each([-1, Number.NaN, "10"])("rejects the price %s", async (price) => {
      await expect(
        updateProductPriceAction("product-1", price as number)
      ).rejects.toThrow(
        new BadRequestError("Price must be a non-negative number")
      );
    });

    it("rejects an empty id", async () => {
      await expect(updateProductPriceAction("", 1)).rejects.toThrow(
        new BadRequestError("Invalid product ID")
      );
    });
  });

  describe.each([
    [
      "toggleProductStockAction",
      () => toggleProductStockAction("product-1", true),
      "Failed to toggle stock.",
    ],
    [
      "updateProductPriceAction",
      () => updateProductPriceAction("product-1", 1),
      "Failed to update price.",
    ],
  ])("%s ownership and errors", (_name, act, fallback) => {
    it("rejects a user without a shop", async () => {
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(act()).rejects.toThrow(
        new UnauthorizedError("Unauthorized")
      );
    });

    it.each([null, buildProduct({ shop_id: "x" })])(
      "rejects a missing or foreign product (%o)",
      async (found) => {
        products.findById.mockResolvedValue(found as never);

        await expect(act()).rejects.toBeInstanceOf(ForbiddenError);
      }
    );

    it("wraps unexpected errors", async () => {
      products.findById.mockResolvedValue(buildProduct() as never);
      products.update.mockRejectedValue(new Error("db"));

      await expect(act()).rejects.toThrow(new InternalServerError(fallback));
    });
  });
});
