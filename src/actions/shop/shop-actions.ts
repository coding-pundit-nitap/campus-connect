"use server";

import { runAction } from "@/actions/_shared/action-helpers";
import {
  batchRepository,
  categoryServices,
  fileUploadService,
  notificationService,
  shopRepository,
  userRepository,
} from "@/di/container";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { convertPrismaDecimals } from "@/lib/serializers/prisma-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types/response.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";
const log = createLogger("shop-actions");

type BatchSlotInput = NonNullable<ShopActionFormData["batch_slots"]>[number];

/** Positional upload arguments (name, type, size, buffer) for `file`. */
async function uploadArgs(file: File) {
  return [
    file.name,
    file.type,
    file.size,
    Buffer.from(await file.arrayBuffer()),
  ] as const;
}

/** Batch-slot rows (without shop id) in the order the vendor listed them. */
function toBatchSlotRows(slots: BatchSlotInput[]) {
  return slots.map((card, idx) => ({
    cutoff_time_minutes: card.cutoff_time_minutes,
    label: card.label?.trim() || null,
    is_active: true,
    sort_order: idx,
  }));
}

export async function createShopAction(formData: ShopActionFormData) {
  const uploadedFiles: string[] = [];

  try {
    const user = await authUtils.getUserData();
    const user_id = user.id;
    if (!user_id) {
      throw new UnauthorizedError("User is not authorized to create a shop");
    }

    if (user.shop_id) {
      throw new BadRequestError(
        "You already have a shop linked. Update your existing shop instead."
      );
    }

    const existingShop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (existingShop?.id) {
      throw new BadRequestError(
        "You already have a shop linked. Update your existing shop instead."
      );
    }

    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }
    const {
      name,
      description,
      location,
      opening,
      closing,
      image,
      qr_image,
      upi_id,
      min_order_value,
      batch_min_order_value,
      batch_slots,
      default_delivery_fee,
      direct_delivery_fee,
    } = parsedData.data;

    let image_key = "";
    if (image) {
      const uploadResult = await fileUploadService.uploadOptimizedImage(
        ...(await uploadArgs(image)),
        { prefix: "shop-images" }
      );
      image_key = uploadResult.key;
      uploadedFiles.push(image_key);
    }

    let qr_image_key = "";
    if (qr_image) {
      const uploadResult = await fileUploadService.uploadOptimizedImage(
        ...(await uploadArgs(qr_image)),
        { prefix: "shop-qr-images" }
      );
      qr_image_key = uploadResult.key;
      uploadedFiles.push(qr_image_key);
    }

    const newShop = await shopRepository.create({
      data: {
        closing,
        description,
        location,
        name,
        opening,
        image_key,
        qr_image_key,
        upi_id,
        min_order_value,
        batch_min_order_value: batch_min_order_value ?? null,
        default_delivery_fee,
        direct_delivery_fee,
        user: { connect: { id: user_id } },
      },
    });

    let batchCardsSaved = true;
    if (batch_slots && batch_slots.length > 0) {
      try {
        await batchRepository.createManySlots(
          toBatchSlotRows(batch_slots).map((row) => ({
            shop_id: newShop.id,
            ...row,
          }))
        );
      } catch {
        batchCardsSaved = false;
      }
    }

    return createSuccessResponse(
      convertPrismaDecimals(newShop),
      batchCardsSaved
        ? "Shop created successfully! Please log out and back in to access the seller dashboard."
        : "Shop created successfully, but batch cards could not be saved (migration pending). The shop will run in direct-delivery mode."
    );
  } catch (error) {
    for (const fileKey of uploadedFiles) {
      try {
        await fileUploadService.deleteFile(fileKey);
      } catch (cleanupError) {
        log.error(
          `Failed to cleanup file ${fileKey} after shop creation failure: ${cleanupError}`
        );
      }
    }

    log.error(`CREATE SHOP ERROR: ${error}`);
    if (
      error instanceof BadRequestError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to create shop.");
  }
}

export async function updateShopAction(formData: ShopActionFormData) {
  return runAction(
    log,
    { label: "UPDATE SHOP ERROR:", fallback: "Failed to update shop." },
    async () => {
      const user_id = await authUtils.getUserId();
      const context = await shopRepository.findByOwnerId(user_id, {
        select: { id: true, image_key: true, qr_image_key: true },
      });
      if (!context || !context.id) {
        throw new UnauthorizedError("User is not authorized to update a shop");
      }

      const parsedData = shopActionSchema.safeParse(formData);
      if (!parsedData.success) {
        throw new BadRequestError(parsedData.error.message);
      }

      await categoryServices.cleanupEmptyCategories();

      const { image, qr_image, batch_slots, ...rest } = parsedData.data;

      const updateData: Omit<
        ShopActionFormData,
        "image" | "qr_image" | "batch_slots"
      > & {
        image_key?: string;
        qr_image_key?: string;
      } = {
        ...rest,
      };

      if (image) {
        updateData.image_key = await fileUploadService.upload(
          ...(await uploadArgs(image)),
          { prefix: "shop-images" }
        );

        if (context.image_key) {
          await fileUploadService.deleteFile(context.image_key);
        }
      }

      if (qr_image) {
        updateData.qr_image_key = await fileUploadService.upload(
          ...(await uploadArgs(qr_image)),
          { prefix: "shop-qr-images" }
        );

        if (context.qr_image_key) {
          await fileUploadService.deleteFile(context.qr_image_key);
        }
      }

      const updatedShop = await shopRepository.update(context.id, {
        ...updateData,
        ...(batch_slots && batch_slots.length > 0
          ? {
              batch_slots: {
                deleteMany: {},
                create: toBatchSlotRows(batch_slots),
              },
            }
          : {}),
      });

      await notificationService.publishNotification(user_id, {
        title: "Shop Updated Successfully",
        message: `Your shop ${updatedShop.name} has been updated.`,
        action_url: `/owner-shops`,
        type: "INFO",
      });

      return createSuccessResponse(
        convertPrismaDecimals(updatedShop),
        "Shop updated successfully!"
      );
    }
  );
}

export async function deleteShopAction() {
  return runAction(
    log,
    { label: "DELETE SHOP ERROR:", fallback: "Failed to delete shop." },
    async () => {
      const user_id = await authUtils.getUserId();
      const context = await shopRepository.findByOwnerId(user_id, {
        select: {
          id: true,
          image_key: true,
          qr_image_key: true,
        },
      });
      if (!context || !context.id) {
        throw new UnauthorizedError("User is not authorized to delete a shop");
      }

      const deleteQuietly = (key: string, what: string) =>
        fileUploadService.deleteFile(key).catch((err) => {
          log.error({ err }, `Failed to delete ${what} ${key}:`);
        });

      await Promise.all([
        ...(context.image_key
          ? [deleteQuietly(context.image_key, "shop image")]
          : []),
        ...(context.qr_image_key
          ? [deleteQuietly(context.qr_image_key, "shop QR image")]
          : []),
      ]);

      await shopRepository.delete(context.id);

      await userRepository.update(user_id, {
        owned_shop: { disconnect: true },
      });

      return createSuccessResponse(null, "Shop deleted successfully");
    }
  );
}

export async function toggleAcceptingOrdersAction(acceptingOrders: boolean) {
  return runAction(
    log,
    {
      label: "TOGGLE ACCEPTING ORDERS ERROR:",
      fallback: "Failed to toggle order acceptance.",
      passthrough: [UnauthorizedError, BadRequestError],
    },
    async () => {
      const user = await authUtils.getUserData();
      const user_id = user.id;
      if (!user_id) {
        throw new UnauthorizedError("User is not authorized");
      }

      const shop = await shopRepository.findByOwnerId(user_id, {
        select: { id: true, is_active: true },
      });

      if (!shop) {
        throw new BadRequestError("You don't have a shop to update");
      }

      if (!shop.is_active) {
        throw new BadRequestError(
          "Cannot toggle orders - your shop is deactivated by admin"
        );
      }

      await shopRepository.update(shop.id, {
        accepting_orders: acceptingOrders,
      });

      return createSuccessResponse(
        { accepting_orders: acceptingOrders },
        acceptingOrders
          ? "Shop is now accepting orders"
          : "Shop is now paused - no new orders will be accepted"
      );
    }
  );
}
