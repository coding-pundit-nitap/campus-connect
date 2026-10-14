import {
  ADMIN_ID,
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditService,
  notificationService,
  userRepository,
} from "@/di/container";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/custom-error";

import {
  deleteUserAction,
  forceSignOutUserAction,
  getAllUsersAction,
  getUserStatsAction,
  makeUserAdminAction,
  removeUserAdminAction,
  suspendUserAction,
  unsuspendUserAction,
} from "./user-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const users = vi.mocked(userRepository);

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "user-1",
    email: "u@example.com",
    role: "USER",
    status: "ACTIVE",
    owned_shop: null,
    ...overrides,
  }) as never;

describe("admin user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllUsersAction", () => {
    itGuardsAdminAccess(
      () => getAllUsersAction({ limit: 10 }),
      "Failed to retrieve users."
    );

    it("returns a page without filters", async () => {
      users.findMany.mockResolvedValue(rows(2, "u") as never);

      const res = await getAllUsersAction({ limit: 10 });

      expect(users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          take: 11,
          skip: 0,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        })
      );
      expect(res.data).toEqual({
        data: rows(2, "u"),
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies search, role and cursor and reports the next cursor", async () => {
      users.findMany.mockResolvedValue(rows(3, "u") as never);

      const res = await getAllUsersAction({
        limit: 2,
        cursor: CURSOR,
        search: "bob",
        role: "ADMIN",
      });

      expect(users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "bob", mode: "insensitive" } },
              { email: { contains: "bob", mode: "insensitive" } },
            ],
            role: "ADMIN",
          },
          skip: 1,
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.hasMore).toBe(true);
      expect(res.data?.nextCursor).toBe("u-2");
    });

    it("rejects invalid options without querying", async () => {
      await expect(getAllUsersAction({ limit: -1 })).rejects.toThrow(
        BadRequestError
      );
      expect(users.findMany).not.toHaveBeenCalled();
    });
  });

  describe("makeUserAdminAction", () => {
    itGuardsAdminAccess(
      () => makeUserAdminAction("user-1"),
      "Failed to promote user to admin."
    );

    it("promotes the user and audits the change", async () => {
      users.findById.mockResolvedValue(user());
      users.update.mockResolvedValue(user({ role: "ADMIN" }));

      const res = await makeUserAdminAction("user-1");

      expect(users.update).toHaveBeenCalledWith("user-1", { role: "ADMIN" });
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_MAKE_ADMIN",
        "USER",
        "user-1",
        { email: "u@example.com" }
      );
      expect(res.data).toEqual({
        id: "user-1",
        email: "u@example.com",
        role: "ADMIN",
      });
    });

    it("rejects a blank id", async () => {
      await expect(makeUserAdminAction("  ")).rejects.toThrow(BadRequestError);
      expect(users.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(makeUserAdminAction("user-1")).rejects.toThrow(
        NotFoundError
      );
    });

    it("forbids promoting an existing admin", async () => {
      users.findById.mockResolvedValue(user({ role: "ADMIN" }));

      await expect(makeUserAdminAction("user-1")).rejects.toThrow(
        "User is already an admin"
      );
      expect(users.update).not.toHaveBeenCalled();
    });
  });

  describe("removeUserAdminAction", () => {
    itGuardsAdminAccess(
      () => removeUserAdminAction("user-1"),
      "Failed to remove admin privileges."
    );

    it("demotes an admin and audits the change", async () => {
      users.findById.mockResolvedValue(user({ role: "ADMIN" }));
      users.update.mockResolvedValue(user({ role: "USER" }));

      const res = await removeUserAdminAction("user-1");

      expect(users.update).toHaveBeenCalledWith("user-1", { role: "USER" });
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_REMOVE_ADMIN",
        "USER",
        "user-1",
        { email: "u@example.com" }
      );
      expect(res.data?.role).toBe("USER");
    });

    it("rejects a blank id", async () => {
      await expect(removeUserAdminAction("")).rejects.toThrow(BadRequestError);
    });

    it("forbids demoting yourself", async () => {
      await expect(removeUserAdminAction(ADMIN_ID)).rejects.toThrow(
        "You cannot remove your own admin privileges"
      );
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(removeUserAdminAction("user-1")).rejects.toThrow(
        NotFoundError
      );
    });

    it("forbids demoting a non-admin", async () => {
      users.findById.mockResolvedValue(user());

      await expect(removeUserAdminAction("user-1")).rejects.toThrow(
        "User is not an admin"
      );
    });
  });

  describe("getUserStatsAction", () => {
    itGuardsAdminAccess(
      () => getUserStatsAction(),
      "Failed to retrieve user statistics."
    );

    it("aggregates the user counts", async () => {
      users.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(4);

      const res = await getUserStatsAction();

      expect(res.data).toEqual({
        totalUsers: 10,
        totalAdmins: 2,
        totalRegularUsers: 8,
        recentUsers: 3,
        activeUsers: 6,
        inactiveUsers: 4,
      });
    });
  });

  describe("forceSignOutUserAction", () => {
    itGuardsAdminAccess(
      () => forceSignOutUserAction("user-1"),
      "Failed to sign out user."
    );

    it("deletes all sessions and audits", async () => {
      users.findById.mockResolvedValue(user());

      const res = await forceSignOutUserAction("user-1");

      expect(users.deleteAllSessions).toHaveBeenCalledWith("user-1");
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_FORCE_SIGNOUT",
        "USER",
        "user-1",
        { email: "u@example.com" }
      );
      expect(res.data).toBeNull();
    });

    it("rejects a blank id", async () => {
      await expect(forceSignOutUserAction(" ")).rejects.toThrow(
        BadRequestError
      );
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(forceSignOutUserAction("user-1")).rejects.toThrow(
        NotFoundError
      );
      expect(users.deleteAllSessions).not.toHaveBeenCalled();
    });
  });

  describe("deleteUserAction", () => {
    itGuardsAdminAccess(
      () => deleteUserAction("user-1"),
      "Failed to delete user."
    );

    it("deletes a user without a shop and audits", async () => {
      users.findById.mockResolvedValue(user());
      users.delete.mockResolvedValue(user());

      const res = await deleteUserAction("user-1");

      expect(users.delete).toHaveBeenCalledWith("user-1");
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_DELETE",
        "USER",
        "user-1",
        { email: "u@example.com" }
      );
      expect(res.data).toEqual({ id: "user-1", email: "u@example.com" });
    });

    it("rejects a blank id", async () => {
      await expect(deleteUserAction("")).rejects.toThrow(BadRequestError);
    });

    it("forbids deleting yourself", async () => {
      await expect(deleteUserAction(ADMIN_ID)).rejects.toThrow(
        "You cannot delete your own account"
      );
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(deleteUserAction("user-1")).rejects.toThrow(NotFoundError);
    });

    it("forbids deleting a shop owner", async () => {
      users.findById.mockResolvedValue(
        user({ owned_shop: { id: "s1", name: "Cafe" } })
      );

      await expect(deleteUserAction("user-1")).rejects.toThrow(
        /owns shop "Cafe"/
      );
      expect(users.delete).not.toHaveBeenCalled();
    });
  });

  describe("suspendUserAction", () => {
    itGuardsAdminAccess(
      () => suspendUserAction("user-1", "spam"),
      "Failed to suspend user."
    );

    it("suspends, signs out, audits and notifies the user", async () => {
      users.findById.mockResolvedValue(user());
      users.update.mockResolvedValue(user({ status: "SUSPENDED" }));

      const res = await suspendUserAction("user-1", "spam");

      expect(users.update).toHaveBeenCalledWith("user-1", {
        status: "SUSPENDED",
        suspended_at: expect.any(Date),
        suspended_reason: "spam",
      });
      expect(users.deleteAllSessions).toHaveBeenCalledWith("user-1");
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_SUSPEND",
        "USER",
        "user-1",
        { email: "u@example.com", reason: "spam" }
      );
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          title: "Account Suspended",
          message: "Your account has been suspended. Reason: spam",
        })
      );
      expect(res.data?.status).toBe("SUSPENDED");
    });

    it("rejects a blank id", async () => {
      await expect(suspendUserAction("", "x")).rejects.toThrow(BadRequestError);
    });

    it("forbids suspending yourself", async () => {
      await expect(suspendUserAction(ADMIN_ID, "x")).rejects.toThrow(
        "You cannot suspend your own account"
      );
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(suspendUserAction("user-1", "x")).rejects.toThrow(
        NotFoundError
      );
    });

    it.each(["SUSPENDED", "BANNED"])(
      "forbids suspending a %s user",
      async (status) => {
        users.findById.mockResolvedValue(user({ status }));

        await expect(suspendUserAction("user-1", "x")).rejects.toThrow(
          `User is already ${status.toLowerCase()}`
        );
      }
    );
  });

  describe("unsuspendUserAction", () => {
    itGuardsAdminAccess(
      () => unsuspendUserAction("user-1"),
      "Failed to unsuspend user."
    );

    it("restores the user, audits and notifies", async () => {
      users.findById.mockResolvedValue(user({ status: "SUSPENDED" }));
      users.update.mockResolvedValue(user({ status: "ACTIVE" }));

      const res = await unsuspendUserAction("user-1");

      expect(users.update).toHaveBeenCalledWith("user-1", {
        status: "ACTIVE",
        suspended_at: null,
        suspended_reason: null,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "USER_UNSUSPEND",
        "USER",
        "user-1",
        { email: "u@example.com" }
      );
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ title: "Account Restored" })
      );
      expect(res.data?.status).toBe("ACTIVE");
    });

    it("rejects a blank id", async () => {
      await expect(unsuspendUserAction("")).rejects.toThrow(BadRequestError);
    });

    it("throws NotFoundError for an unknown user", async () => {
      users.findById.mockResolvedValue(null);

      await expect(unsuspendUserAction("user-1")).rejects.toThrow(
        NotFoundError
      );
    });

    it("forbids restoring an active user", async () => {
      users.findById.mockResolvedValue(user());

      await expect(unsuspendUserAction("user-1")).rejects.toThrow(
        ForbiddenError
      );
    });
  });
});
