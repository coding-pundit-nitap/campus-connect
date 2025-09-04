import { NotFoundError } from "@/lib/custom-error";
import { cartRepository, productRepository } from "@/repositories";
import { FullCart } from "@/types";

class CartService {
  async getAllUserCarts(user_id: string): Promise<FullCart[]> {
    return cartRepository.getAllUserCarts(user_id, {
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getCartForShop(user_id: string, shop_id: string) {
    return cartRepository.findOrCreate(user_id, shop_id);
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
