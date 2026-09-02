import { describe, expect, it, vi } from "vitest";

import { CartItemData, SerializedCartItem, SerializedFullCart, ShopCart } from "@/types";

import cartUIService from "./cart.utils";

vi.mock("./image.utils", () => ({
  ImageUtils: {
    getImageUrl: (key: string | null) => (key ? `https://images.example.com/${key}` : null),
  },
}));

describe("CartDrawerServices", () => {
  describe("calculateCartItemsPrice", () => {
    it("calculates price correctly with no discounts", () => {
      const items: CartItemData[] = [
        { id: "1", price: 100, quantity: 2, discount: 0 } as CartItemData,
        { id: "2", price: 50, quantity: 1, discount: 0 } as CartItemData,
      ];
      expect(cartUIService.calculateCartItemsPrice(items)).toBe(250);
    });

    it("calculates price correctly with discounts", () => {
      const items: CartItemData[] = [
        { id: "1", price: 100, quantity: 2, discount: 10 } as CartItemData, // 90 * 2 = 180
        { id: "2", price: 50, quantity: 1, discount: 20 } as CartItemData,  // 40 * 1 = 40
      ];
      expect(cartUIService.calculateCartItemsPrice(items)).toBe(220);
    });

    it("handles 100% discount", () => {
      const items: CartItemData[] = [
        { id: "1", price: 100, quantity: 2, discount: 100 } as CartItemData,
      ];
      expect(cartUIService.calculateCartItemsPrice(items)).toBe(0);
    });

    it("handles empty cart", () => {
      expect(cartUIService.calculateCartItemsPrice([])).toBe(0);
    });
    
    it("handles null/undefined discount (treats as 0 logically though the type says number)", () => {
      const items = [
        { id: "1", price: 100, quantity: 2, discount: null as unknown as number } as CartItemData,
      ];
      // (100 * (100 - 0)) / 100 * 2 = 200
      expect(cartUIService.calculateCartItemsPrice(items)).toBe(200);
    });
  });

  describe("calculateCartItemsCount", () => {
    it("calculates total items correctly", () => {
      const items: CartItemData[] = [
        { id: "1", quantity: 2 } as CartItemData,
        { id: "2", quantity: 5 } as CartItemData,
      ];
      expect(cartUIService.calculateCartItemsCount(items)).toBe(7);
    });

    it("returns 0 for empty array", () => {
      expect(cartUIService.calculateCartItemsCount([])).toBe(0);
    });
  });

  describe("transformCartItem", () => {
    it("transforms correctly with all fields present", () => {
      const item = {
        id: "item1",
        quantity: 2,
        product_id: "prod1",
        product: {
          name: "Test Product",
          price: "150.55", // Prisma Decimal mock
          discount: "10",
          image_key: "test-image.png",
          shop: {
            id: "shop1",
            name: "Test Shop",
          },
        },
      } as unknown as SerializedCartItem;

      const result = cartUIService.transformCartItem(item);

      expect(result).toEqual({
        id: "item1",
        image_url: "https://images.example.com/test-image.png",
        price: 150.55,
        quantity: 2,
        name: "Test Product",
        shop_name: "Test Shop",
        product_id: "prod1",
        shop_id: "shop1",
        discount: 10,
      });
    });

    it("handles missing shop data and image", () => {
      const item = {
        id: "item2",
        quantity: 1,
        product_id: "prod2",
        product: {
          name: "Product 2",
          price: "50",
          discount: null,
          image_key: null,
          shop: null,
        },
      } as unknown as SerializedCartItem;

      const result = cartUIService.transformCartItem(item);

      expect(result).toEqual({
        id: "item2",
        image_url: "/placeholders/placeholder.png",
        price: 50,
        quantity: 1,
        name: "Product 2",
        shop_name: "Unknown Shop",
        product_id: "prod2",
        shop_id: "unknown",
        discount: 0,
      });
    });
  });

  describe("transformToShopCart", () => {
    it("transforms FullCart to ShopCart correctly", () => {
      const cart = {
        id: "cart1",
        items: [
          {
            id: "item1",
            quantity: 2,
            product_id: "prod1",
            product: {
              name: "Product",
              price: "100",
              discount: "10", // 90 * 2 = 180
              image_key: "img1",
              shop: {
                id: "shop1",
                name: "Shop 1",
                qr_image_key: "qr1",
                upi_id: "upi@test",
                min_order_value: 50,
                accepting_orders: true,
              },
            },
          },
        ],
      } as unknown as SerializedFullCart;

      const result = cartUIService.transformToShopCart(cart);

      expect(result).toEqual({
        id: "cart1",
        items: [
          expect.objectContaining({
            id: "item1",
            name: "Product",
            price: 100,
            quantity: 2,
            discount: 10,
          }),
        ],
        totalPrice: 180,
        totalItems: 2,
        shop_name: "Shop 1",
        qr_image_key: "qr1",
        upi_id: "upi@test",
        min_order_value: 50,
        shop_accepting_orders: true,
      });
    });

    it("handles empty items array gracefully", () => {
      const cart = {
        id: "cart1",
        items: [],
      } as unknown as SerializedFullCart;
      
      expect(() => cartUIService.transformToShopCart(cart)).toThrow();
    });
  });

  describe("createCartSummary", () => {
    it("creates summary from multiple shop carts", () => {
      const shopCarts = [
        { totalPrice: 100, totalItems: 2, items: [{ shop_id: "shop1" }] },
        { totalPrice: 250, totalItems: 5, items: [{ shop_id: "shop2" }] },
      ] as ShopCart[];

      const summary = cartUIService.createCartSummary(shopCarts);

      expect(summary).toEqual({
        totalPrice: 350,
        totalItems: 7,
        shopCarts,
        shop_id: "shop1", // Picks from first cart
      });
    });

    it("handles empty shop carts", () => {
      const summary = cartUIService.createCartSummary([]);

      expect(summary).toEqual({
        totalPrice: 0,
        totalItems: 0,
        shopCarts: [],
        shop_id: "unknown",
      });
    });
  });

  describe("transformFullCartsToShopCarts", () => {
    it("transforms and filters out empty carts", () => {
      const fullCarts = [
        {
          id: "cart1",
          items: [
            {
              id: "item1",
              quantity: 1,
              product_id: "prod1",
              product: {
                name: "Product",
                price: "100",
                discount: "0",
                shop: {
                  id: "shop1", name: "Shop 1", qr_image_key: "qr1", upi_id: "upi@1", min_order_value: 10, accepting_orders: true,
                },
              },
            },
          ],
        },
        {
          id: "cart2",
          items: [], // Should be filtered out
        },
      ] as unknown as SerializedFullCart[];

      const result = cartUIService.transformFullCartsToShopCarts(fullCarts);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("cart1");
    });
  });

  describe("quantity updaters", () => {
    it("updateItemQuantity calls mutationFn with new quantity", () => {
      const mutationFn = vi.fn();
      cartUIService.updateItemQuantity("prod1", 5, mutationFn);
      expect(mutationFn).toHaveBeenCalledWith({ product_id: "prod1", quantity: 5 });
    });

    it("increaseItemQuantity increments quantity", () => {
      const mutationFn = vi.fn();
      cartUIService.increaseItemQuantity("prod1", 5, mutationFn);
      expect(mutationFn).toHaveBeenCalledWith({ product_id: "prod1", quantity: 6 });
    });

    it("decreaseItemQuantity decrements quantity", () => {
      const mutationFn = vi.fn();
      cartUIService.decreaseItemQuantity("prod1", 5, mutationFn);
      expect(mutationFn).toHaveBeenCalledWith({ product_id: "prod1", quantity: 4 });
    });
  });
});
