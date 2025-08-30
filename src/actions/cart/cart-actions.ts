import authUtils from "@/lib/utils/auth.utils";
import { cartRepository } from "@/repositories";
import { CartValidation, UpsertItemData } from "@/validations/cart";

export const upsertCartItem = async (formData: UpsertItemData) => {
  try {
    await authUtils.isAuthenticated();
    const result = CartValidation.upsertItemSchema.safeParse(formData);
    if (!result.success) {
      throw new Error("Invalid input data");
    }
    const validData = result.data;

    const updatedCart = await cartRepository.upsertCartItem(
      validData.product_id,
      validData.quantity
    );

    return updatedCart;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw new Error("Failed to update cart item");
  }
};
