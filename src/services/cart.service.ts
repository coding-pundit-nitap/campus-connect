import { notFound } from "next/navigation";

import { NotFoundError } from "@/lib/custom-error";
import { cartUIService, serializeFullCart } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils";
import { cartRepository, productRepository } from "@/repositories";
import { FullCart } from "@/types";

class CartService {
  async getAllUserCarts(user_id: string): Promise<FullCart[]> {
    return cartRepository.getAllUserCartsWithItems(user_id);
  }

  async getCartForShop(user_id: string, shop_id: string) {
    return cartRepository.findOrCreate(user_id, shop_id);
  }

  async getCartData(cart_id: string) {
    const user_id = await authUtils.getUserId();

    const fullCart = await cartRepository.getUserCartWithItemsByCartId(
      user_id,
      cart_id
    );
    if (!fullCart || fullCart.items.length === 0) {
      return notFound();
    }

    const cart = cartUIService.transformToShopCart(serializeFullCart(fullCart));

    return {
      cart,
      total: cart.totalPrice,
      shop_id: cart.items[0].shop_id,
      qr_image_key: cart.qr_image_key,
      upi_id: cart.upi_id,
    };
  }

  async upsertCartItem(user_id: string, product_id: string, quantity: number) {
    const product = await productRepository.findById(product_id);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    const cart = await cartRepository.findOrCreate(user_id, product.shop_id);

    if (quantity > 0) {
      await cartRepository.upsertItem(cart.id, product_id, quantity);
    } else {
      await cartRepository.removeItem(cart.id, product_id);
    }

    return this.getCartForShop(user_id, product.shop_id);
  }
}

export const cartService = new CartService();

export default cartService;
