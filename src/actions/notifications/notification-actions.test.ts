import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import {
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import { NotificationCategory } from "@/types/prisma.types";

import {
  getNotificationsByCategoryAction,
  markAllNotificationsAsReadAction,
} from "./notification-actions";

vi.mock("@/di/container", async () => {
  const h = await import("@tests/helpers");
  return h.mockModule({
    container: { notificationRepository: h.mockOf() },
  });
});
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const auth = vi.mocked(authUtils);
const repo = vi.mocked(container.notificationRepository);

describe("notification-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  describe("markAllNotificationsAsReadAction", () => {
    it("marks the user's notifications as read", async () => {
      repo.markAllAsRead.mockResolvedValue({ count: 4 } as never);

      const res = await markAllNotificationsAsReadAction();

      expect(repo.markAllAsRead).toHaveBeenCalledWith("user-1");
      expect(res).toMatchObject({
        data: { count: 4 },
        details: "All notifications marked as read",
      });
    });

    it("throws UnauthorizedError without a user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(markAllNotificationsAsReadAction()).rejects.toThrow(
        new UnauthorizedError("Unauthorized: Please log in.")
      );
    });

    it("rethrows UnauthenticatedError", async () => {
      auth.getUserId.mockRejectedValue(new UnauthenticatedError());

      await expect(markAllNotificationsAsReadAction()).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
    });

    it("wraps repository failures", async () => {
      repo.markAllAsRead.mockRejectedValue(new Error("x"));

      await expect(markAllNotificationsAsReadAction()).rejects.toThrow(
        new InternalServerError("Failed to mark notifications as read.")
      );
    });
  });

  describe("getNotificationsByCategoryAction", () => {
    it("uses a default page size of 20", async () => {
      repo.getNotificationsByCategory.mockResolvedValue({
        notifications: [],
      } as never);

      const res = await getNotificationsByCategoryAction(
        NotificationCategory.ORDER
      );

      expect(repo.getNotificationsByCategory).toHaveBeenCalledWith(
        "user-1",
        NotificationCategory.ORDER,
        { limit: 20, cursor: undefined }
      );
      expect(res.data).toEqual({ notifications: [] });
    });

    it("forwards the limit and cursor", async () => {
      await getNotificationsByCategoryAction(NotificationCategory.ORDER, {
        limit: 5,
        cursor: "c1",
      });

      expect(repo.getNotificationsByCategory).toHaveBeenCalledWith(
        "user-1",
        NotificationCategory.ORDER,
        { limit: 5, cursor: "c1" }
      );
    });

    it("throws UnauthorizedError without a user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(
        getNotificationsByCategoryAction(NotificationCategory.ORDER)
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("wraps repository failures", async () => {
      repo.getNotificationsByCategory.mockRejectedValue(new Error("x"));

      await expect(
        getNotificationsByCategoryAction(NotificationCategory.ORDER)
      ).rejects.toThrow(
        new InternalServerError("Failed to retrieve notifications.")
      );
    });
  });
});
