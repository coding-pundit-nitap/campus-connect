"use server";
import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { serializeFullCart } from "@/lib/utils-functions";
import authUtils from "@/lib/utils-functions/auth.utils";
import { cartRepository } from "@/repositories";
import { UpsertItemData, upsertItemSchema } from "@/validations/cart";

export const upsertCartItem = async (formData: UpsertItemData) => {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("User not authenticated");
    }
    const result = upsertItemSchema.parse(formData);
    const validData = result;

    const updatedCart = await cartRepository.upsertItem(
      user_id,
      validData.product_id,
      validData.quantity
    );

    return serializeFullCart(updatedCart);
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw new InternalServerError("Failed to update cart item");
  }
};
