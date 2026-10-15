"use server";
import {
  AUTH_ERRORS,
  requireUserId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { cartRepository } from "@/di/container";
import { NotFoundError, ValidationError } from "@/lib/custom-error";
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
      passthrough: [ValidationError, NotFoundError, ...AUTH_ERRORS],
    },
    async () => {
      const user_id = await requireUserId("User not authenticated");
      const parsed = upsertItemSchema.safeParse(formData);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues.map((i) => i.message).join(", ")
        );
      }
      const validData = parsed.data;

      const updatedCart = await cartRepository.upsertItemForUser(
        user_id,
        validData.product_id,
        validData.quantity
      );

      return serializeFullCart(updatedCart);
    }
  );
