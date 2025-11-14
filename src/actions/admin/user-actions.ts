"use server";

import { Prisma, Role } from "@prisma/client";
import z from "zod";

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import userRepository from "@/repositories/user.repository";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { verifyAdmin } from "../authentication/admin";

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
  try {
    await verifyAdmin();
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
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
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

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, -1) : users;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccessResponse(
      {
        data,
        nextCursor,
        hasMore,
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve users.");
  }
}

export async function makeUserAdminAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string; role: Role }>> {
  try {
    await verifyAdmin();
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

    return createSuccessResponse(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      `Successfully promoted ${updatedUser.email} to admin`
    );
  } catch (error) {
    console.error("MAKE USER ADMIN ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to promote user to admin.");
  }
}

export async function removeUserAdminAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string; role: Role }>> {
  try {
    const currentUserId = await verifyAdmin();
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

    return createSuccessResponse(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      `Successfully removed admin privileges from ${updatedUser.email}`
    );
  } catch (error) {
    console.error("REMOVE USER ADMIN ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to remove admin privileges.");
  }
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
  try {
    await verifyAdmin();

    const [totalUsers, totalAdmins, recentUsers, activeUsers, inactiveUsers] =
      await Promise.all([
        userRepository.count({}),
        userRepository.count({ role: Role.ADMIN }),
        userRepository.count({
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        }),
        userRepository.count({ sessions: { some: {} } }),
        userRepository.count({ sessions: { none: {} } }),
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
  } catch (error) {
    console.error("GET USER STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve user statistics.");
  }
}

export async function forceSignOutUserAction(
  targetUserId: string
): Promise<ActionResponse<null>> {
  try {
    await verifyAdmin();
    if (typeof targetUserId !== "string" || targetUserId.trim() === "") {
      throw new BadRequestError("Invalid user ID");
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    await userRepository.deleteAllSessions(targetUserId);

    return createSuccessResponse(
      null,
      `Successfully signed out user ${targetUser.email} from all devices`
    );
  } catch (error) {
    console.error("FORCE SIGN OUT USER ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to sign out user.");
  }
}

export async function deleteUserAction(
  targetUserId: string
): Promise<ActionResponse<{ id: string; email: string }>> {
  try {
    const currentUserId = await verifyAdmin();

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

    // Delete the user (will cascade delete sessions, accounts, carts, orders, etc.)
    const deletedUser = await userRepository.delete(targetUserId);

    return createSuccessResponse(
      {
        id: deletedUser.id,
        email: deletedUser.email,
      },
      `Successfully deleted user ${deletedUser.email}`
    );
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to delete user.");
  }
}
