import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Role } from "@/../prisma/generated/client";
import { auth, User } from "@/auth";

export interface IAuthUtils {
  getUserData: () => Promise<User>;
  isAuthenticated: () => Promise<boolean>;
  getUserId: () => Promise<string>;
  unAuthenticated: () => never;
}

class AuthUtils implements IAuthUtils {
  async getUserData() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || !session.user.id) {
      this.unAuthenticated();
    }
    return session.user;
  }
  async isAuthenticated() {
    const user = await this.getUserData();
    return !!user;
  }

  async getUserId() {
    const user = await this.getUserData();
    if (!user || !user.id) {
      this.unAuthenticated();
    }
    return user.id;
  }

  unAuthenticated(): never {
    return redirect("/login");
  }

  unAuthorized(): never {
    return redirect("/");
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
