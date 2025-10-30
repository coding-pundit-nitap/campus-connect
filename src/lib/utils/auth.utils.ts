import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const authUtils = {
  async getUserData() {
    throw new Error(
      "authUtils.getUserData is server-only. Use server actions or call the /api/users/me endpoint from client code."
    );
  },
  async isAuthenticated() {
    // conservative default for client: return false. Client code should
    // rely on the client session hook (e.g. useSession) instead.
    return false;
  },
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
