import { beforeEach, describe, expect, it } from "vitest";

import {
  deleteUserAction,
  forceSignOutUserAction,
  getAllUsersAction,
  getUserStatsAction,
  makeUserAdminAction,
  removeUserAdminAction,
  suspendUserAction,
  unsuspendUserAction,
} from "@/actions/admin/user-actions";

import { createShop, createUser } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("Admin User Actions Integration", () => {
  let admin: { id: string; role: string; name: string };

  beforeEach(async () => {
    admin = await createUser({ role: "ADMIN", name: "Super Admin" });
  });

  describe("getAllUsersAction", () => {
    it("should return paginated users as admin", async () => {
      await asUser(admin);
      await createUser({ name: "Alice" });
      await createUser({ name: "Bob" });

      const response = await getAllUsersAction({ limit: 10 });
      expect(response.data.data.length).toBeGreaterThanOrEqual(3); // admin + Alice + Bob
      expect(response.data.hasMore).toBeDefined();
    });

    it("should filter users by search", async () => {
      await asUser(admin);
      await createUser({ name: "Charlie", email: "charlie@test.com" });
      await createUser({ name: "Delta" });

      const response = await getAllUsersAction({
        search: "charlie",
        limit: 10,
      });
      expect(response.data.data.length).toBe(1);
      expect(response.data.data[0].name).toBe("Charlie");
    });

    it("should filter users by role", async () => {
      await asUser(admin);
      await createUser({ role: "USER", name: "User 1" });

      const response = await getAllUsersAction({ role: "ADMIN", limit: 10 });
      expect(response.data.data.every((u) => u.role === "ADMIN")).toBe(true);
      expect(response.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should support cursor pagination", async () => {
      await asUser(admin);
      await createUser({ id: "cltest0000000000000000001", name: "A1" });
      await createUser({ id: "cltest0000000000000000002", name: "A2" });
      await createUser({ id: "cltest0000000000000000003", name: "A3" });

      const firstPage = await getAllUsersAction({ limit: 2 });
      expect(firstPage.data.data.length).toBe(2);
      expect(firstPage.data.hasMore).toBe(true);
      expect(firstPage.data.nextCursor).toBeDefined();

      const secondPage = await getAllUsersAction({
        limit: 2,
        cursor: firstPage.data.nextCursor!,
      });
      expect(secondPage.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should throw if anonymous", async () => {
      asAnonymous();
      await expect(getAllUsersAction({ limit: 10 })).rejects.toThrow();
    });
  });

  describe("makeUserAdminAction", () => {
    it("should promote regular user to admin", async () => {
      await asUser(admin);
      const user = await createUser({ role: "USER" });

      await makeUserAdminAction(user.id);

      const updated = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updated?.role).toBe("ADMIN");
    });

    it("should throw ForbiddenError if already admin", async () => {
      await asUser(admin);
      const user = await createUser({ role: "ADMIN" });

      await expect(makeUserAdminAction(user.id)).rejects.toThrowError(
        "User is already an admin"
      ); // Assuming this is the message, or just testing the throw type if possible
    });

    it("should throw NotFoundError if user doesn't exist", async () => {
      await asUser(admin);
      await expect(makeUserAdminAction("non-existent-id")).rejects.toThrow();
    });

    it("should throw BadRequestError if empty userId", async () => {
      await asUser(admin);
      await expect(makeUserAdminAction("")).rejects.toThrow();
    });

    it("should throw if non-admin", async () => {
      const user = await createUser({ role: "USER" });
      await asUser(user);
      await expect(makeUserAdminAction(user.id)).rejects.toThrow();
    });
  });

  describe("removeUserAdminAction", () => {
    it("should demote admin to user", async () => {
      await asUser(admin);
      const user = await createUser({ role: "ADMIN" });

      await removeUserAdminAction(user.id);

      const updated = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updated?.role).toBe("USER");
    });

    it("should throw ForbiddenError on self-demotion", async () => {
      await asUser(admin);
      await expect(removeUserAdminAction(admin.id)).rejects.toThrow();
    });

    it("should throw ForbiddenError if target not admin", async () => {
      await asUser(admin);
      const user = await createUser({ role: "USER" });

      await expect(removeUserAdminAction(user.id)).rejects.toThrow();
    });

    it("should throw NotFoundError if target doesn't exist", async () => {
      await asUser(admin);
      await expect(removeUserAdminAction("invalid-id")).rejects.toThrow();
    });
  });

  describe("getUserStatsAction", () => {
    it("should return correct counts", async () => {
      await asUser(admin);
      await createUser({ role: "USER", status: "ACTIVE" });
      await createUser({ role: "ADMIN", status: "ACTIVE" });
      await createUser({ role: "USER", status: "SUSPENDED" });

      const statsResponse = await getUserStatsAction();
      const stats = statsResponse.data;
      expect(stats.totalUsers).toBeGreaterThanOrEqual(4);
      expect(stats.totalAdmins).toBeGreaterThanOrEqual(2);
    });
  });

  describe("forceSignOutUserAction", () => {
    it("should delete user sessions", async () => {
      await asUser(admin);
      const user = await createUser();
      await testPrisma.session.create({
        data: {
          id: "sess-1",
          userId: user.id,
          token: "tok-1",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      await forceSignOutUserAction(user.id);

      const sessions = await testPrisma.session.findMany({
        where: { userId: user.id },
      });
      expect(sessions.length).toBe(0);
    });

    it("should throw if target doesn't exist", async () => {
      await asUser(admin);
      await expect(forceSignOutUserAction("invalid-id")).rejects.toThrow();
    });
  });

  describe("deleteUserAction", () => {
    it("should delete regular user", async () => {
      await asUser(admin);
      const user = await createUser();

      await deleteUserAction(user.id);

      const found = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(found).toBeNull();
    });

    it("should throw ForbiddenError on self-deletion", async () => {
      await asUser(admin);
      await expect(deleteUserAction(admin.id)).rejects.toThrow();
    });

    it("should throw ForbiddenError if target owns shop", async () => {
      await asUser(admin);
      const user = await createUser();
      const shop = await createShop();
      await testPrisma.user.update({
        where: { id: user.id },
        data: { shop_id: shop.id },
      });

      await expect(deleteUserAction(user.id)).rejects.toThrow();
    });

    it("should throw if target doesn't exist", async () => {
      await asUser(admin);
      await expect(deleteUserAction("invalid-id")).rejects.toThrow();
    });
  });

  describe("suspendUserAction", () => {
    it("should suspend user and delete sessions", async () => {
      await asUser(admin);
      const user = await createUser({ status: "ACTIVE" });
      await testPrisma.session.create({
        data: {
          id: "sess-2",
          userId: user.id,
          token: "tok-2",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      await suspendUserAction(user.id, "Violation");

      const updated = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updated?.status).toBe("SUSPENDED");
      expect(updated?.suspended_at).toBeDefined();

      const sessions = await testPrisma.session.findMany({
        where: { userId: user.id },
      });
      expect(sessions.length).toBe(0);
    });

    it("should throw ForbiddenError if already suspended", async () => {
      await asUser(admin);
      const user = await createUser({ status: "SUSPENDED" });

      await expect(suspendUserAction(user.id, "Violation")).rejects.toThrow();
    });

    it("should throw ForbiddenError on self-suspension", async () => {
      await asUser(admin);
      await expect(suspendUserAction(admin.id, "Violation")).rejects.toThrow();
    });
  });

  describe("unsuspendUserAction", () => {
    it("should unsuspend user and clear suspended fields", async () => {
      await asUser(admin);
      const user = await createUser({
        status: "SUSPENDED",
        suspended_at: new Date(),
      });

      await unsuspendUserAction(user.id);

      const updated = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updated?.status).toBe("ACTIVE");
      expect(updated?.suspended_at).toBeNull();
    });
  });
});
