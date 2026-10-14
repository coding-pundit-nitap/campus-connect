import {
  ADMIN_ID,
  asAdmin,
  itGuardsAdminAccess,
} from "@tests/helpers/actions-admin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auditService, container, notificationService } from "@/di/container";
import { BadRequestError } from "@/lib/custom-error";
import { NotificationCategory, NotificationType } from "@/types/prisma.types";

import {
  getBroadcastStatsAction,
  sendBroadcastNotificationAction,
} from "./broadcast-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

describe("admin broadcast actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("sendBroadcastNotificationAction", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    itGuardsAdminAccess(
      () => sendBroadcastNotificationAction({ title: "t", message: "m" }),
      "Failed to send broadcast notification."
    );

    it("broadcasts with default type and category and audits it", async () => {
      vi.useFakeTimers({ now: 1_700_000_000_000 });
      const message = "m".repeat(150);

      const res = await sendBroadcastNotificationAction({
        title: "Hello",
        message,
      });

      expect(notificationService.broadcastNotification).toHaveBeenCalledWith({
        title: "Hello",
        message,
        type: "INFO",
        category: "ANNOUNCEMENT",
        action_url: undefined,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "BROADCAST_CREATE",
        "BROADCAST",
        "broadcast-1700000000000",
        { title: "Hello", message: "m".repeat(100) }
      );
      expect(res.data).toEqual({
        id: "broadcast-1700000000000",
        title: "Hello",
        message,
      });
    });

    it("uses the same id for the audit entry and the response", async () => {
      // Regression: the id used to be computed twice with Date.now().
      vi.useFakeTimers({ now: 1_000 });
      vi.mocked(auditService.log).mockImplementationOnce(async () => {
        vi.setSystemTime(5_000);
      });

      const res = await sendBroadcastNotificationAction({
        title: "t",
        message: "m",
      });

      expect(vi.mocked(auditService.log).mock.calls[0][3]).toBe(res.data?.id);
    });

    it("passes explicit type, category and action url through", async () => {
      await sendBroadcastNotificationAction({
        title: "t",
        message: "m",
        type: NotificationType.WARNING,
        category: NotificationCategory.SYSTEM,
        action_url: "/x",
      });

      expect(notificationService.broadcastNotification).toHaveBeenCalledWith({
        title: "t",
        message: "m",
        type: "WARNING",
        category: "SYSTEM",
        action_url: "/x",
      });
    });

    it("rejects an empty title with BadRequestError", async () => {
      await expect(
        sendBroadcastNotificationAction({ title: "", message: "m" })
      ).rejects.toThrow(BadRequestError);
      expect(notificationService.broadcastNotification).not.toHaveBeenCalled();
    });
  });

  describe("getBroadcastStatsAction", () => {
    itGuardsAdminAccess(
      () => getBroadcastStatsAction(),
      "Failed to retrieve broadcast statistics."
    );

    it("returns user and broadcast counts", async () => {
      vi.mocked(container.userRepository.count).mockResolvedValue(50);
      vi.mocked(container.broadcastRepository.getCount)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(2);

      const res = await getBroadcastStatsAction();

      expect(res.data).toEqual({
        totalBroadcasts: 9,
        recentBroadcasts: 2,
        totalUsers: 50,
      });
    });
  });
});
