import { User } from "next-auth";

import { auth } from "@/auth";

export interface IAuthUtils {
  getUserData: () => Promise<User>;
  isAuthenticated: () => Promise<boolean>;
  getUserId: () => Promise<string>;
  unAuthenticated: () => never;
}

class AuthUtils implements IAuthUtils {
  async getUserData() {
    const session = await auth();
    if (!session || !session.user) this.unAuthenticated();
    return session.user;
  }
  async isAuthenticated() {
    const user = await this.getUserData();
    return !!user;
  }

  async getUserId() {
    const user = await this.getUserData();
    return user.id!;
  }

  unAuthenticated(): never {
    throw new Error("User not authenticated");
  }

  unAuthorized(): never {
    throw new Error("User not authorized");
  }

  async isSeller(): Promise<boolean> {
    const user = await this.getUserData();
    return !!user && !!user.shop_id;
  }

  async getShopId(): Promise<string> {
    const user = await this.getUserData();
    if (!user || !user.shop_id) this.unAuthorized();
    return user.shop_id!;
  }
}

export const authUtils = new AuthUtils();

export default authUtils;
