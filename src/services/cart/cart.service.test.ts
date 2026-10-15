import { mockOf } from "@tests/helpers";
import { buildCart, buildProduct } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import { NotFoundError } from "@/lib/custom-error";
import { cartUIService, serializeFullCart } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";
import { CartRepository } from "@/repositories/cart.repository";
import { PlatformSettingsRepository } from "@/repositories/platform-settings.repository";
import { ProductRepository } from "@/repositories/product.repository";

import { CartService } from "./cart.service";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils", async () =>
  (await import("@tests/helpers")).mockModule({
    serializeFullCart: vi.fn((cart: unknown) => ({ serialized: cart })),
  })
);

type FullCartRow = Awaited<
  ReturnType<CartRepository["getUserCartWithItemsByCartId"]>
>;

const shopData = {
  default_delivery_fee: "15",
  direct_delivery_fee: "30",
  opening: "09:00",
  closing: "21:00",
  accepting_orders: true,
  batch_slots: [{ id: "slot-1" }],
};

const shopCart = {
  id: "cart-1",
  totalPrice: 200,
  items: [{ shop_id: "shop-1" }],
  qr_image_key: "qr.png",
  upi_id: "store@upi",
};

describe("CartService", () => {
  let cartRepository: Mocked<CartRepository>;
  let platformSettingsRepository: Mocked<PlatformSettingsRepository>;
  let productRepository: Mocked<ProductRepository>;
  let service: CartService;

  beforeEach(() => {
    vi.clearAllMocks();
    cartRepository = mockOf<CartRepository>();
    platformSettingsRepository = mockOf<PlatformSettingsRepository>();
    productRepository = mockOf<ProductRepository>();
    service = new CartService(
      cartRepository,
      platformSettingsRepository,
      productRepository
    );
    vi.mocked(authUtils).getUserId.mockResolvedValue("user-1");
    platformSettingsRepository.getPlatformFee.mockResolvedValue(5);
    vi.mocked(cartUIService.transformToShopCart).mockReturnValue(
      shopCart as never
    );
  });

  it("getAllUserCarts delegates to the repository", async () => {
    const carts = [buildCart()];
    cartRepository.getAllUserCartsWithItems.mockResolvedValue(carts as never);

    await expect(service.getAllUserCarts("user-1")).resolves.toBe(carts);
    expect(cartRepository.getAllUserCartsWithItems).toHaveBeenCalledWith(
      "user-1"
    );
  });

  it("getCartForShop finds or creates the cart", async () => {
    const cart = buildCart();
    cartRepository.findOrCreate.mockResolvedValue(cart as never);

    await expect(service.getCartForShop("user-1", "shop-1")).resolves.toBe(
      cart
    );
    expect(cartRepository.findOrCreate).toHaveBeenCalledWith(
      "user-1",
      "shop-1"
    );
  });

  describe("getCartData", () => {
    const fullCart = (shop: unknown) =>
      buildCart({
        items: [{ product: { shop } }],
      }) as unknown as FullCartRow;

    it("loads the current user's cart and computes totals", async () => {
      const cart = fullCart(shopData);
      cartRepository.getUserCartWithItemsByCartId.mockResolvedValue(cart);

      const result = await service.getCartData("cart-1");

      expect(cartRepository.getUserCartWithItemsByCartId).toHaveBeenCalledWith(
        "user-1",
        "cart-1"
      );
      expect(serializeFullCart).toHaveBeenCalledWith(cart);
      expect(result).toEqual({
        cart: shopCart,
        item_total: 200,
        delivery_fee: 15,
        direct_delivery_fee: 30,
        platform_fee: 5,
        total: 220,
        shop_id: "shop-1",
        qr_image_key: "qr.png",
        upi_id: "store@upi",
        shop_opening: "09:00",
        shop_closing: "21:00",
        shop_accepting_orders: true,
        batch_slots: [{ id: "slot-1" }],
      });
    });

    it("falls back to zero fees and closed shop when shop data is missing", async () => {
      cartRepository.getUserCartWithItemsByCartId.mockResolvedValue(
        fullCart(undefined)
      );

      const result = await service.getCartData("cart-1");

      expect(result).toMatchObject({
        delivery_fee: 0,
        direct_delivery_fee: 0,
        total: 205,
        shop_opening: undefined,
        shop_closing: undefined,
        shop_accepting_orders: false,
        batch_slots: [],
      });
    });

    it.each([
      ["missing", null],
      ["empty", buildCart({ items: [] })],
    ])("throws notFound when the cart is %s", async (_label, cart) => {
      cartRepository.getUserCartWithItemsByCartId.mockResolvedValue(
        cart as unknown as FullCartRow
      );

      await expect(service.getCartData("cart-1")).rejects.toThrow(
        "NEXT_NOT_FOUND"
      );
      expect(platformSettingsRepository.getPlatformFee).not.toHaveBeenCalled();
    });

    it("propagates auth failures", async () => {
      vi.mocked(authUtils).getUserId.mockRejectedValue(new Error("unauth"));

      await expect(service.getCartData("cart-1")).rejects.toThrow("unauth");
      expect(
        cartRepository.getUserCartWithItemsByCartId
      ).not.toHaveBeenCalled();
    });
  });

  describe("upsertCartItem", () => {
    beforeEach(() => {
      productRepository.findById.mockResolvedValue(buildProduct() as never);
      cartRepository.findOrCreate.mockResolvedValue(buildCart() as never);
    });

    it("throws NotFoundError for an unknown product", async () => {
      productRepository.findById.mockResolvedValue(null as never);

      await expect(
        service.upsertCartItem("user-1", "prod-x", 1)
      ).rejects.toThrow(new NotFoundError("Product not found."));
      expect(cartRepository.findOrCreate).not.toHaveBeenCalled();
    });

    it("upserts a positive quantity and returns the refreshed cart", async () => {
      const refreshed = buildCart({ id: "cart-1" });
      cartRepository.findOrCreate
        .mockResolvedValueOnce(buildCart() as never)
        .mockResolvedValueOnce(refreshed as never);

      const result = await service.upsertCartItem("user-1", "prod-1", 3);

      expect(cartRepository.findOrCreate).toHaveBeenCalledWith(
        "user-1",
        "shop-1"
      );
      expect(cartRepository.upsertItemForUser).toHaveBeenCalledWith(
        "user-1",
        "prod-1",
        3
      );
      expect(cartRepository.removeItemFromCart).not.toHaveBeenCalled();
      expect(result).toBe(refreshed);
    });

    it.each([0, -1])("removes the item when quantity is %i", async (qty) => {
      await service.upsertCartItem("user-1", "prod-1", qty);

      expect(cartRepository.removeItemFromCart).toHaveBeenCalledWith(
        "cart-1",
        "prod-1"
      );
      expect(cartRepository.upsertItemForUser).not.toHaveBeenCalled();
    });
  });
});
