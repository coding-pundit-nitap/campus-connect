import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { env } from "@/config/env.config";
import { notificationService } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET, PATCH } from "./route";

const auth = vi.mocked(authUtils);
const service = vi.mocked(notificationService);

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    service.getUserNotifications.mockResolvedValue({ data: [] } as never);
  });

  it("defaults to 20 items and no cursor", async () => {
    await expectSuccess(await GET(makeRequest("/api/notifications")));

    expect(service.getUserNotifications).toHaveBeenCalledWith(
      "user-1",
      20,
      undefined
    );
  });

  it.each([
    ["0", 1],
    ["7", 7],
    ["100000", env.MAX_PAGE_SIZE],
  ])("clamps limit=%s to %d", async (limit, expected) => {
    await GET(makeRequest(`/api/notifications?limit=${limit}&cursor=c1`));

    expect(service.getUserNotifications).toHaveBeenCalledWith(
      "user-1",
      expected,
      "c1"
    );
  });

  it("falls back to 20 for a non-numeric limit", async () => {
    await GET(makeRequest("/api/notifications?limit=abc"));

    expect(service.getUserNotifications).toHaveBeenCalledWith(
      "user-1",
      20,
      undefined
    );
  });

  it("returns 500 when the service fails", async () => {
    service.getUserNotifications.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/notifications")),
      500,
      "Failed to fetch notifications"
    );
  });
});

describe("PATCH /api/notifications", () => {
  const patch = (body: unknown) =>
    PATCH(makeRequest("/api/notifications", { method: "PATCH", body }));

  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("marks notifications and broadcasts as read", async () => {
    await expectSuccess(
      await patch({
        notification_ids: ["n1"],
        broadcast_notification_ids: ["b1"],
      })
    );

    expect(service.markNotificationsAsRead).toHaveBeenCalledWith("user-1", [
      "n1",
    ]);
    expect(service.markBroadcastsAsRead).toHaveBeenCalledWith("user-1", ["b1"]);
  });

  it.each([{}, { notification_ids: [], broadcast_notification_ids: [] }])(
    "does nothing for empty input (%o)",
    async (body) => {
      await expectSuccess(await patch(body));

      expect(service.markNotificationsAsRead).not.toHaveBeenCalled();
      expect(service.markBroadcastsAsRead).not.toHaveBeenCalled();
    }
  );

  it("returns 500 when the service fails", async () => {
    service.markBroadcastsAsRead.mockRejectedValue(new Error("db"));

    await expectError(
      await patch({ broadcast_notification_ids: ["b1"] }),
      500,
      "Failed to mark notifications as read"
    );
  });
});
