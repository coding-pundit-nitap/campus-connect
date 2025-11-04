// Client-safe placeholder for auth utilities.
// The real server-side implementation lives in `auth.utils.server.ts`.
// Importing server-only APIs like `next/headers` or `next/navigation` from
// client code causes build errors. This module intentionally does not
// depend on Next server APIs — it throws helpful errors if used in the wrong
// runtime so developers can pick the correct API (server or client).

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
    throw new Error(
      "authUtils.getUserId is server-only. Use server actions or client session hooks to access user id."
    );
  },
  unAuthenticated() {
    throw new Error("authUtils.unAuthenticated is server-only.");
  },
  unAuthorized() {
    throw new Error("authUtils.unAuthorized is server-only.");
  },
  async isSeller() {
    return false;
  },
  async getOwnedShopId() {
    throw new Error("authUtils.getOwnedShopId is server-only.");
  },
  async isAdmin() {
    return false;
  },
};

export default authUtils;
