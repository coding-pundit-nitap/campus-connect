"use server";

import { Prisma, Role } from "@prisma/client";

import {
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

import { verifyAdmin } from "../authentication/admin";
export async function getAllUsersAction(options: {
  limit?: number;
  cursor?: string;
  search?: string;
  role?: Role;
}): Promise<
  ActionResponse<
    CursorPaginatedResponse<{
      id: string;
      name: string;
      email: string;
      role: Role;
      phone: string | null;
      image: string | null;
      created_at: Date;
    }>
  >
> {
  try {
    await verifyAdmin();

    const limit = options.limit || 20;
    const where: Prisma.UserWhereInput | undefined = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.role) {
      where.role = options.role;
    }

    const users = await userRepository.findMany({
      where,
      take: limit + 1,
      skip: options.cursor ? 1 : 0,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        created_at: true,
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
  }>
> {
  try {
    await verifyAdmin();

    const [totalUsers, totalAdmins, recentUsers] = await Promise.all([
      userRepository.count({}),
      userRepository.count({ role: Role.ADMIN }),
      userRepository.count({
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      }),
    ]);

    return createSuccessResponse(
      {
        totalUsers,
        totalAdmins,
        totalRegularUsers: totalUsers - totalAdmins,
        recentUsers,
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
