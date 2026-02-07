"use server";
import { Role } from "@/generated/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils/auth.utils.server";

export async function verifyAdmin(): Promise<string> {
  const user = await authUtils.getUserData();

  if (!user || !user.id) {
    throw new UnauthorizedError("Unauthorized: Please log in.");
  }

  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError("Access denied: Admin privileges required.");
  }

  return user.id;
}
