import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  bulkCreateProductsAction,
  createProductAction,
  deleteProductAction,
  toggleProductStockAction,
  updateProductAction,
  updateProductPriceAction,
} from "@/actions/product/product-actions";
import { fileUploadService } from "@/di/container";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/custom-error";

import { createShop, createUser, seedShopWithProducts } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("Product Actions", () => {
  beforeEach(() => {
    vi.spyOn(fileUploadService, "uploadOptimizedImage").mockResolvedValue({
      key: "test-key",
      originalSize: 1000,
      optimizedSize: 900,
      compressionRatio: 10,
    });
  });
  describe("createProductAction", () => {
    it("throws if anonymous", async () => {
      await asAnonymous();
      await expect(
        createProductAction({
          name: "Test Product",
          price: 100,
          stock_quantity: 10,
          category: "Test",
          brand: "Brand",
          image: new File([""], "test.png", { type: "image/png" }),
        })
      ).rejects.toThrow(Error); // `createProductAction` catches all and throws `InternalServerError`
    });

    it("throws if not shop owner", async () => {
      const user = await createUser();
      await asUser(user);
      await expect(
        createProductAction({
          name: "Test Product",
          price: 100,
          stock_quantity: 10,
          category: "Test",
          brand: "Brand",
          image: new File([""], "test.png", { type: "image/png" }),
        })
      ).rejects.toThrow(Error); // `createProductAction` catches all and throws `InternalServerError`
    });

    it("creates a product when shop owner", async () => {
      const shop = await createShop();
      const owner = await createUser({ shop_id: shop.id });
      await asUser(owner);

      const res = await createProductAction({
        name: "New Product",
        price: 150,
        stock_quantity: 5,
        description: "A new product",
        discount: 10,
        category: "Beverages",
        brand: "Coke",
        image: new File([""], "test.png", { type: "image/png" }),
      });

      expect(res.data).toBeDefined();
      expect(res.data?.name).toBe("New Product");

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: res.data!.id },
      });
      expect(dbProduct).toBeDefined();
      expect(Number(dbProduct?.price)).toBe(150);
      expect(dbProduct?.shop_id).toBe(shop.id);
    });
  });

  describe("updateProductAction", () => {
    it("throws if not owner", async () => {
      const { products } = await seedShopWithProducts({ productCount: 1 });
      const otherUser = await createUser();
      await asUser(otherUser);

      await expect(
        updateProductAction(products[0].id, {
          name: "Updated Name",
          price: 200,
          stock_quantity: 20,
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws ForbiddenError if user is owner of a different shop", async () => {
      const { products } = await seedShopWithProducts({ productCount: 1 });

      const otherShop = await createShop();
      const otherOwner = await createUser({ shop_id: otherShop.id });
      await asUser(otherOwner);

      await expect(
        updateProductAction(products[0].id, {
          name: "Updated Name",
          price: 200,
          stock_quantity: 20,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("updates product successfully as owner", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      const res = await updateProductAction(products[0].id, {
        name: "Updated Name",
        price: 999,
        stock_quantity: 50,
      });

      expect(res.data?.name).toBe("Updated Name");

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: products[0].id },
      });
      expect(Number(dbProduct?.price)).toBe(999);
      expect(dbProduct?.stock_quantity).toBe(50);
    });
  });

  describe("deleteProductAction", () => {
    it("soft deletes product as owner", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      await deleteProductAction(products[0].id);

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: products[0].id },
      });
      expect(dbProduct?.deleted_at).not.toBeNull();
    });

    it("throws Forbidden if wrong shop owner", async () => {
      const { products } = await seedShopWithProducts({ productCount: 1 });

      const otherShop = await createShop();
      const otherOwner = await createUser({ shop_id: otherShop.id });
      await asUser(otherOwner);

      await expect(deleteProductAction(products[0].id)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("toggleProductStockAction", () => {
    it("toggles stock to default amount when set to in stock", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      // manually set to out of stock first
      await testPrisma.product.update({
        where: { id: products[0].id },
        data: { stock_quantity: 0 },
      });

      await asUser(owner);

      const res = await toggleProductStockAction(products[0].id, true);
      expect(res.data?.stock_quantity).toBe(99); // DEFAULT_IN_STOCK_QUANTITY

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: products[0].id },
      });
      expect(dbProduct?.stock_quantity).toBe(99);
    });

    it("toggles stock to 0 when set to out of stock", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      const res = await toggleProductStockAction(products[0].id, false);
      expect(res.data?.stock_quantity).toBe(0);
    });
  });

  describe("updateProductPriceAction", () => {
    it("updates the price for the owner's product", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      const res = await updateProductPriceAction(products[0].id, 249);
      expect(res.data?.price).toBe(249);

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: products[0].id },
      });
      expect(Number(dbProduct?.price)).toBe(249);
    });

    it("throws BadRequestError for a negative price", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      await expect(
        updateProductPriceAction(products[0].id, -10)
      ).rejects.toThrow(BadRequestError);
    });

    it("throws Forbidden if not the product's shop owner", async () => {
      const { products } = await seedShopWithProducts({ productCount: 1 });

      const otherShop = await createShop();
      const otherOwner = await createUser({ shop_id: otherShop.id });
      await asUser(otherOwner);

      await expect(
        updateProductPriceAction(products[0].id, 100)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("bulkCreateProductsAction", () => {
    it("creates multiple products", async () => {
      const shop = await createShop();
      const owner = await createUser({ shop_id: shop.id });
      await asUser(owner);

      const res = await bulkCreateProductsAction([
        {
          name: "Bulk 1",
          price: 10,
          stock_quantity: 5,
        },
        {
          name: "Bulk 2",
          price: 20,
          stock_quantity: 10,
          category: "BulkCategory",
        },
      ]);

      expect(res.data?.created).toBe(2);
      expect(res.data?.products).toHaveLength(2);

      const dbProducts = await testPrisma.product.findMany({
        where: { shop_id: shop.id, name: { startsWith: "Bulk" } },
      });
      expect(dbProducts).toHaveLength(2);
    });
  });
});
