"use server";

import z from "zod";

import {
  auditService,
  notificationService,
  userRepository,
} from "@/di/container";
import { Prisma, Role, UserStatus } from "@/generated/client";
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
const log = createLogger("user-actions");

const getAllUsersSchema = searchSchema.extend({
  role: z.enum(Role).optional(),
});
export async function getAllUsersAction(
  options: z.infer<typeof getAllUsersSchema>
): Promise<
  ActionResponse<
    CursorPaginatedResponse<{
      id: string;
      name: string;
      email: string;
      role: Role;
      phone: string | null;
      image: string | null;
      createdAt: Date;
    }>
  >
> {
  return runAdminAction(
    log,
    {
      label: "GET ALL USERS ERROR:",
      fallback: "Failed to retrieve users.",
    },
    async () => {
      const parsedData = getAllUsersSchema.safeParse(options);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid options");
      }
      const { limit, cursor, search, role } = parsedData.data;
      const where: Prisma.UserWhereInput | undefined = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role;
      }

      const users = await userRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          image: true,
          createdAt: true,
        },
      });

      const { data, nextCursor, hasMore } = toCursorPage(users, limit);

      return createSuccessResponse(
        {
          data,
          nextCursor,
          hasMore,
        },
        "Users retrieved successfully"
      );
    }
  );
}

export async function makeUserAdminAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string; role: Role }>> {
  return runAdminAction(
    log,
    {
      label: "MAKE USER ADMIN ERROR:",
      fallback: "Failed to promote user to admin.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }
      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (targetUser.role === Role.ADMIN) {
        throw new ForbiddenError("User is already an admin");
      }

      const updatedUser = await userRepository.update(targetUserId, {
        role: Role.ADMIN,
      });

      auditService.log(admin_id, "USER_MAKE_ADMIN", "USER", targetUserId, {
        email: targetUser.email,
      });

      return createSuccessResponse(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        `Successfully promoted ${updatedUser.email} to admin`
      );
    }
  );
}

export async function removeUserAdminAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string; role: Role }>> {
  return runAdminAction(
    log,
    {
      label: "REMOVE USER ADMIN ERROR:",
      fallback: "Failed to remove admin privileges.",
      passthrough: [NotFoundError],
    },
    async (currentUserId) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }
      if (currentUserId === targetUserId) {
        throw new ForbiddenError("You cannot remove your own admin privileges");
      }

      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (targetUser.role !== Role.ADMIN) {
        throw new ForbiddenError("User is not an admin");
      }

      const updatedUser = await userRepository.update(targetUserId, {
        role: Role.USER,
      });

      auditService.log(
        currentUserId,
        "USER_REMOVE_ADMIN",
        "USER",
        targetUserId,
        {
          email: targetUser.email,
        }
      );

      return createSuccessResponse(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        `Successfully removed admin privileges from ${updatedUser.email}`
      );
    }
  );
}

export async function getUserStatsAction(): Promise<
  ActionResponse<{
    totalUsers: number;
    totalAdmins: number;
    totalRegularUsers: number;
    recentUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "GET USER STATS ERROR:",
      fallback: "Failed to retrieve user statistics.",
    },
    async () => {
      const [totalUsers, totalAdmins, recentUsers, activeUsers, inactiveUsers] =
        await Promise.all([
          userRepository.count({}),
          userRepository.count({ where: { role: Role.ADMIN } }),
          userRepository.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          userRepository.count({ where: { sessions: { some: {} } } }),
          userRepository.count({ where: { sessions: { none: {} } } }),
        ]);

      return createSuccessResponse(
        {
          totalUsers,
          totalAdmins,
          totalRegularUsers: totalUsers - totalAdmins,
          recentUsers,
          activeUsers,
          inactiveUsers,
        },
        "User statistics retrieved successfully"
      );
    }
  );
}

export async function forceSignOutUserAction(
  targetUserId: string
): Promise<ActionResponse<null>> {
  return runAdminAction(
    log,
    {
      label: "FORCE SIGN OUT USER ERROR:",
      fallback: "Failed to sign out user.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }
      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      await userRepository.deleteAllSessions(targetUserId);

      auditService.log(admin_id, "USER_FORCE_SIGNOUT", "USER", targetUserId, {
        email: targetUser.email,
      });

      return createSuccessResponse(
        null,
        `Successfully signed out user ${targetUser.email} from all devices`
      );
    }
  );
}

export async function deleteUserAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string }>> {
  return runAdminAction(
    log,
    {
      label: "DELETE USER ERROR:",
      fallback: "Failed to delete user.",
      passthrough: [NotFoundError],
    },
    async (currentUserId) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }
      if (currentUserId === targetUserId) {
        throw new ForbiddenError("You cannot delete your own account");
      }

      const targetUser = await userRepository.findById(targetUserId, {
        include: {
          owned_shop: {
            select: { id: true, name: true },
          },
        },
      });

      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      // Check if user owns a shop - cannot delete user who owns a shop
      if (targetUser.owned_shop) {
        throw new ForbiddenError(
          `Cannot delete user. User owns shop "${targetUser.owned_shop.name}". Please delete or transfer the shop first.`
        );
      }
      const deletedUser = await userRepository.delete(targetUserId);

      auditService.log(currentUserId, "USER_DELETE", "USER", targetUserId, {
        email: targetUser.email,
      });

      return createSuccessResponse(
        {
          id: deletedUser.id,
          email: deletedUser.email,
        },
        `Successfully deleted user ${deletedUser.email}`
      );
    }
  );
}

export async function suspendUserAction(
  targetUserId: string,
  reason: string
): Promise<ActionResponse<{ id: string; email: string; status: UserStatus }>> {
  return runAdminAction(
    log,
    {
      label: "SUSPEND USER ERROR:",
      fallback: "Failed to suspend user.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }
      if (admin_id === targetUserId) {
        throw new ForbiddenError("You cannot suspend your own account");
      }

      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (targetUser.status === "SUSPENDED" || targetUser.status === "BANNED") {
        throw new ForbiddenError(
          `User is already ${targetUser.status.toLowerCase()}`
        );
      }

      const updatedUser = await userRepository.update(targetUserId, {
        status: "SUSPENDED",
        suspended_at: new Date(),
        suspended_reason: reason,
      });

      // Force sign out the user
      await userRepository.deleteAllSessions(targetUserId);

      auditService.log(admin_id, "USER_SUSPEND", "USER", targetUserId, {
        email: targetUser.email,
        reason,
      });

      await notificationService.publishNotification(targetUserId, {
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${reason}`,
        type: "ERROR",
        category: "SYSTEM",
      });

      return createSuccessResponse(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status,
        },
        `Successfully suspended user ${updatedUser.email}`
      );
    }
  );
}

export async function unsuspendUserAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string; status: UserStatus }>> {
  return runAdminAction(
    log,
    {
      label: "UNSUSPEND USER ERROR:",
      fallback: "Failed to unsuspend user.",
      passthrough: [NotFoundError],
    },
    async (admin_id) => {
      if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
        throw new BadRequestError("Invalid user ID");
      }

      const targetUser = await userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (targetUser.status === "ACTIVE") {
        throw new ForbiddenError("User is already active");
      }

      const updatedUser = await userRepository.update(targetUserId, {
        status: "ACTIVE",
        suspended_at: null,
        suspended_reason: null,
      });

      auditService.log(admin_id, "USER_UNSUSPEND", "USER", targetUserId, {
        email: targetUser.email,
      });

      await notificationService.publishNotification(targetUserId, {
        title: "Account Restored",
        message: "Your account has been restored and is now active.",
        type: "SUCCESS",
        category: "SYSTEM",
      });

      return createSuccessResponse(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status,
        },
        `Successfully unsuspended user ${updatedUser.email}`
      );
    }
  );
}
