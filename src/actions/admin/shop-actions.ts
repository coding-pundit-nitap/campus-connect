"use server";

import z from "zod";

import {
  auditService,
  container,
  fileUploadService,
  notificationService,
} from "@/di/container";
import { Prisma, SellerVerificationStatus } from "@/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { cursorArgs, runAdminAction, toCursorPage } from "./_shared";
const log = createLogger("shop-actions");

const getAllShopsSchema = searchSchema.extend({
  is_active: z.boolean().optional(),
  verification_status: z.enum(SellerVerificationStatus).optional(),
});

export async function getAllShopsAction(
  options: z.infer<typeof getAllShopsSchema>
): Promise<
  ActionResponse<
    CursorPaginatedResponse<{
      id: string;
      name: string;
      description: string;
      location: string;
      is_active: boolean;
      verification_status: SellerVerificationStatus;
      created_at: Date;
      user: {
        id: string;
        name: string;
        email: string;
      } | null;
    }>
  >
> {
  return runAdminAction(
    log,
    {
      label: "GET ALL SHOPS ERROR:",
      fallback: "Failed to retrieve shops.",
    },
    async () => {
      const parsedData = getAllShopsSchema.safeParse(options);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid options");
      }
      const { limit, cursor, search, is_active, verification_status } =
        parsedData.data;
      const where: Prisma.ShopWhereInput | undefined = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (verification_status) {
        where.verification_status = verification_status;
      }

      const shops = await container.shopRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const { data, nextCursor, hasMore } = toCursorPage(shops, limit);

      return createSuccessResponse(
        {
          data: data.map((shop) => ({
            id: shop.id,
            name: shop.name,
            description: shop.description,
            location: shop.location,
            is_active: shop.is_active,
            verification_status: shop.verification_status,
            created_at: shop.created_at,
            user: shop.user,
          })),
          nextCursor,
          hasMore,
        },
        "Shops retrieved successfully"
      );
    }
  );
}

export async function activateShopAction(
  shopId: string
): Promise<ActionResponse<{ id: string; name: string; is_active: boolean }>> {
  return runAdminAction(
    log,
    {
      label: "ACTIVATE SHOP ERROR:",
      fallback: "Failed to activate shop.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof shopId !== "string" || shopId.trim() === "") {
        throw new BadRequestError("Invalid shop ID");
      }
      const shop = await container.shopRepository.findById(shopId, {
        include: { user: { select: { id: true } } },
      });
      if (!shop) {
        throw new NotFoundError("Shop not found");
      }

      if (shop.is_active) {
        throw new ForbiddenError("Shop is already active");
      }

      const updatedShop = await container.shopRepository.update(shopId, {
        is_active: true,
      });

      // Shops can be ownerless (Shop.user is optional): skip the notice then.
      if (shop.user?.id) {
        await notificationService.publishNotification(shop.user.id, {
          title: "Shop Activated",
          message: `Your shop "${shop.name}" has been activated by an admin.`,
          type: "SUCCESS",
          category: "SYSTEM",
          action_url: "/owner-shops",
        });
      }

      auditService.log(admin_id, "SHOP_ACTIVATE", "SHOP", shopId, {
        shop_name: shop.name,
      });

      return createSuccessResponse(
        {
          id: updatedShop.id,
          name: updatedShop.name,
          is_active: updatedShop.is_active,
        },
        `Successfully activated shop "${updatedShop.name}"`
      );
    }
  );
}

export async function deactivateShopAction(
  shopId: string
): Promise<ActionResponse<{ id: string; name: string; is_active: boolean }>> {
  return runAdminAction(
    log,
    {
      label: "DEACTIVATE SHOP ERROR:",
      fallback: "Failed to deactivate shop.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof shopId !== "string" || shopId.trim() === "") {
        throw new BadRequestError("Invalid shop ID");
      }
      const shop = await container.shopRepository.findById(shopId, {
        include: { user: { select: { id: true } } },
      });
      if (!shop) {
        throw new NotFoundError("Shop not found");
      }

      if (!shop.is_active) {
        throw new ForbiddenError("Shop is already inactive");
      }

      const affectedCarts = await container.cartRepository.findMany({
        where: { shop_id: shopId },
        include: {
          items: true,
          user: { select: { id: true, email: true } },
        },
      });

      const affectedUserIds: string[] = [];
      for (const cart of affectedCarts) {
        if (cart.items.length > 0) {
          affectedUserIds.push(cart.user.id);
          await container.db.cartItem.deleteMany({
            where: { cart_id: cart.id },
          });
        }
      }

      await Promise.allSettled(
        affectedUserIds.map((userId) =>
          notificationService.publishNotification(userId, {
            title: "Cart Items Removed",
            message: `Items from "${shop.name}" have been removed from your cart as the shop has been deactivated.`,
            type: "WARNING",
            category: "SYSTEM",
          })
        )
      );

      const updatedShop = await container.shopRepository.update(shopId, {
        is_active: false,
      });

      // Shops can be ownerless (Shop.user is optional): skip the notice then.
      if (shop.user?.id) {
        await notificationService.publishNotification(shop.user.id, {
          title: "Shop Deactivated",
          message: `Your shop "${shop.name}" has been deactivated by an admin.`,
          type: "WARNING",
          category: "SYSTEM",
          action_url: "/owner-shops",
        });
      }

      auditService.log(admin_id, "SHOP_DEACTIVATE", "SHOP", shopId, {
        shop_name: shop.name,
        affected_users: affectedUserIds.length,
      });

      return createSuccessResponse(
        {
          id: updatedShop.id,
          name: updatedShop.name,
          is_active: updatedShop.is_active,
        },
        `Successfully deactivated shop "${updatedShop.name}". ${affectedUserIds.length} user carts were cleared.`
      );
    }
  );
}

export async function deleteShopAction(
  shopId: string
): Promise<ActionResponse<{ id: string; name: string }>> {
  return runAdminAction(
    log,
    {
      label: "DELETE SHOP ERROR:",
      fallback: "Failed to delete shop.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof shopId !== "string" || shopId.trim() === "") {
        throw new BadRequestError("Invalid shop ID");
      }
      const shop = await container.shopRepository.findById(shopId, {
        include: { user: { select: { id: true } } },
      });

      if (!shop) {
        throw new NotFoundError("Shop not found");
      }

      const fileDeletionPromises: Promise<void>[] = [];
      if (shop.image_key) {
        fileDeletionPromises.push(
          fileUploadService.deleteFile(shop.image_key).catch((err) => {
            log.error(
              { err: err },
              `Error deleting shop image ${shop.image_key}:`
            );
          })
        );
      }
      if (shop.qr_image_key) {
        fileDeletionPromises.push(
          fileUploadService.deleteFile(shop.qr_image_key).catch((err) => {
            log.error(
              { err },
              `Error deleting shop QR image ${shop.qr_image_key}:`
            );
          })
        );
      }
      await Promise.all(fileDeletionPromises);

      await container.db.$transaction(async (tx) => {
        if (shop.user?.id) {
          await tx.user.update({
            where: { id: shop.user.id },
            data: { owned_shop: { disconnect: true } },
          });
        }
        await tx.shop.delete({ where: { id: shopId } });
      });

      if (shop.user?.id) {
        try {
          await notificationService.publishNotification(shop.user.id, {
            title: "Shop Deleted",
            message: `Your shop "${shop.name}" has been deleted by an admin.`,
            type: "ERROR",
            category: "SYSTEM",
          });
        } catch (notifyErr) {
          log.error(
            { err: notifyErr },
            "Failed to send shop deletion notification:"
          );
        }
      }

      auditService.log(admin_id, "SHOP_DELETE", "SHOP", shop.id, {
        shop_name: shop.name,
        owner_id: shop.user?.id,
      });

      return createSuccessResponse(
        {
          id: shop.id,
          name: shop.name,
        },
        `Successfully deleted shop "${shop.name}"`
      );
    }
  );
}

export async function updateShopVerificationAction(
  shopId: string,
  status: SellerVerificationStatus
): Promise<
  ActionResponse<{
    id: string;
    name: string;
    verification_status: SellerVerificationStatus;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "UPDATE SHOP VERIFICATION ERROR:",
      fallback: "Failed to update shop verification status.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (
        typeof shopId !== "string" ||
        shopId.trim() === "" ||
        !status ||
        status.trim() === "" ||
        !Object.values(SellerVerificationStatus).includes(status)
      ) {
        throw new BadRequestError("Invalid shop ID");
      }
      const shop = await container.shopRepository.findById(shopId, {
        include: { user: { select: { id: true } } },
      });
      if (!shop) {
        throw new NotFoundError("Shop not found");
      }

      const updatedShop = await container.shopRepository.update(shopId, {
        verification_status: status,
      });

      const statusMessages = {
        NOT_STARTED: "has been reset to not started",
        PENDING: "is now pending verification",
        REQUIRES_ACTION: "requires action from you",
        VERIFIED: "has been verified",
        REJECTED: "verification has been rejected",
      };

      // Shops can be ownerless (Shop.user is optional): skip the notice then.
      if (shop.user?.id) {
        await notificationService.publishNotification(shop.user.id, {
          title: "Shop Verification Status Updated",
          message: `Your shop "${shop.name}" ${statusMessages[status]}.`,
          type:
            status === "VERIFIED"
              ? "SUCCESS"
              : status === "REJECTED"
                ? "ERROR"
                : "INFO",
          category: "SYSTEM",
          action_url: "/owner-shops",
        });
      }

      auditService.log(
        admin_id,
        status === "VERIFIED"
          ? "SHOP_VERIFY"
          : status === "REJECTED"
            ? "SHOP_REJECT"
            : "SHOP_VERIFY",
        "SHOP",
        shopId,
        {
          shop_name: shop.name,
          new_status: status,
          old_status: shop.verification_status,
        }
      );

      return createSuccessResponse(
        {
          id: updatedShop.id,
          name: updatedShop.name,
          verification_status: updatedShop.verification_status,
        },
        `Successfully updated verification status for "${updatedShop.name}"`
      );
    }
  );
}

export async function getShopStatsAction(): Promise<
  ActionResponse<{
    totalShops: number;
    activeShops: number;
    inactiveShops: number;
    verifiedShops: number;
    pendingVerification: number;
    recentShops: number;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "GET SHOP STATS ERROR:",
      fallback: "Failed to retrieve shop statistics.",
    },
    async () => {
      const [
        totalShops,
        activeShops,
        verifiedShops,
        pendingVerification,
        recentShops,
      ] = await Promise.all([
        container.shopRepository.count({}),
        container.shopRepository.count({ where: { is_active: true } }),
        container.shopRepository.count({
          where: { verification_status: "VERIFIED" },
        }),
        container.shopRepository.count({
          where: { verification_status: "PENDING" },
        }),
        container.shopRepository.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return createSuccessResponse(
        {
          totalShops,
          activeShops,
          inactiveShops: totalShops - activeShops,
          verifiedShops,
          pendingVerification,
          recentShops,
        },
        "Shop statistics retrieved successfully"
      );
    }
  );
}
