import { headers } from "next/headers";

import { auth, User } from "@/auth";
import { Role, UserStatus } from "@/generated/client";
import { UnauthenticatedError, UnauthorizedError } from "@/lib/custom-error";

export interface IAuthUtils {
  getUserData: () => Promise<User>;
  isAuthenticated: () => Promise<boolean>;
  getUserId: () => Promise<string>;
  unAuthenticated: () => never;
}

class AuthUtils implements IAuthUtils {
  /**
   * The signed-in user, read fresh from the database (not the 5-minute session
   * cookie cache) so a suspension, ban, forced sign-out or role change takes
   * effect on the very next request.
   * @throws UnauthenticatedError when signed out or the account is not active.
   */
  async getUserData() {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session || !session.user || !session.user.id) {
      this.unAuthenticated();
    }
    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthenticatedError("Your account is not active.");
    }
    return session.user;
  }
  async isAuthenticated() {
    try {
      await this.getUserData();
      return true;
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        return false;
      }
      throw error;
    }
  }

  async getUserId() {
    const user = await this.getUserData();
    if (!user || !user.id) {
      this.unAuthenticated();
    }
    return user.id;
  }

  unAuthenticated(): never {
    throw new UnauthenticatedError("Please log in first.");
  }

  unAuthorized(): never {
    throw new UnauthorizedError("User not authorized");
  }

  async isSeller(): Promise<boolean> {
    const user = await this.getUserData();
    return !!user.shop_id;
  }

  async getOwnedShopId(): Promise<string> {
    const user = await this.getUserData();
    if (!user || !user.shop_id) {
      this.unAuthorized();
    }
    return user.shop_id;
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getUserData();
    return user.role === Role.ADMIN;
  }
}

export const authUtils = new AuthUtils();

export default authUtils;
