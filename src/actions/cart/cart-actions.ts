import authUtils from "@/lib/utils-functions/auth.utils";
import { cartRepository } from "@/repositories";
import { UpsertItemData, upsertItemSchema } from "@/validations/cart";

export const upsertCartItem = async (formData: UpsertItemData) => {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new Error("User not authenticated");
    }
    const result = upsertItemSchema.safeParse(formData);
    if (!result.success) {
      throw new Error("Invalid input data");
    }
    const validData = result.data;

    const updatedCart = await cartRepository.upsertItem(
      user_id,
      validData.product_id,
      validData.quantity
    );

    return updatedCart;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw new Error("Failed to update cart item");
  }
};
