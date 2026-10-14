import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { notificationService } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { PATCH } from "./route";

const auth = vi.mocked(authUtils);
const service = vi.mocked(notificationService);
const ID_A = "cjld2cjxh0000qzrmn831i7rn";
const ID_B = "cjld2cyuq0000t3rmniod1foy";

const patch = (body: unknown) =>
  PATCH(
    makeRequest("/api/notifications/mark-as-read", { method: "PATCH", body })
  );

describe("PATCH /api/notifications/mark-as-read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("marks both notification and broadcast ids as read", async () => {
    await expectSuccess(
      await patch({ notificationIds: [ID_A], broadcastIds: [ID_B] })
    );

    expect(service.markNotificationsAsRead).toHaveBeenCalledWith("user-1", [
      ID_A,
    ]);
    expect(service.markBroadcastsAsRead).toHaveBeenCalledWith("user-1", [ID_B]);
  });

  it.each([{}, { notificationIds: [], broadcastIds: [] }])(
    "skips the service when there is nothing to mark (%o)",
    async (body) => {
      await expectSuccess(await patch(body));

      expect(service.markNotificationsAsRead).not.toHaveBeenCalled();
      expect(service.markBroadcastsAsRead).not.toHaveBeenCalled();
    }
  );

  it("returns 400 for ids that are not cuids", async () => {
    await expectError(
      await patch({ notificationIds: ["nope"] }),
      400,
      "Invalid input"
    );
  });

  it("returns 500 when the service fails", async () => {
    service.markNotificationsAsRead.mockRejectedValue(new Error("db"));

    await expectError(
      await patch({ notificationIds: [ID_A] }),
      500,
      "Failed to mark notifications as read"
    );
  });
});
