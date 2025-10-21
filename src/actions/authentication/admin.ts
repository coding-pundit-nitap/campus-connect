"use server";
import { Role } from "@prisma/client";

import { ForbiddenError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils-functions/auth.utils";
import userRepository from "@/repositories/user.repository";

export async function verifyAdmin(): Promise<string> {
  const userId = await authUtils.getUserId();
  if (!userId) {
    throw new UnauthorizedError("Unauthorized: Please log in.");
  }

  const user = await userRepository.findById(userId);
  if (!user || user.role !== Role.ADMIN) {
    throw new ForbiddenError("Access denied: Admin privileges required.");
  }

  return userId;
}
