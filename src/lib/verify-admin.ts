import { Role } from "@/generated/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils/auth.utils.server";

/**
 * Verifies the current session belongs to an admin user.
 *
 * This is an internal authorization helper, not a client-callable action.
 * It must only be imported into server-side code (e.g. "use server" action
 * files) and invoked there - it must never live in a "use server" module
 * itself, since every export of such a module becomes a callable endpoint.
 *
 * @returns The admin user's id.
 * @throws {UnauthorizedError} If there is no authenticated session.
 * @throws {ForbiddenError} If the authenticated user is not an admin.
 */
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
