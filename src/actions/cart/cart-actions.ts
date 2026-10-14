"use server";
import {
  AUTH_ERRORS,
  requireUserId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { cartRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { serializeFullCart } from "@/lib/utils";
import { UpsertItemData, upsertItemSchema } from "@/validations/cart";
const log = createLogger("cart-actions");

export const upsertCartItem = async (formData: UpsertItemData) =>
  runAction(
    log,
    {
      label: "Error updating cart item:",
      fallback: "Failed to update cart item",
      passthrough: AUTH_ERRORS,
    },
    async () => {
      const user_id = await requireUserId("User not authenticated");
      const validData = upsertItemSchema.parse(formData);

      const updatedCart = await cartRepository.upsertItemForUser(
        user_id,
        validData.product_id,
        validData.quantity
      );

      return serializeFullCart(updatedCart);
    }
  );
