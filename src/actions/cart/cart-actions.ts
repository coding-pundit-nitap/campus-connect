"use server";
import { cartRepository } from "@/di/container";
import {
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { serializeFullCart } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";
import { UpsertItemData, upsertItemSchema } from "@/validations/cart";
const log = createLogger("cart-actions");

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
    log.error({ err: error }, "Error updating cart item:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof UnauthenticatedError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update cart item");
  }
};
