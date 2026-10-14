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

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const service = vi.mocked(notificationService);

describe("GET /api/notifications/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns the user's notification summary", async () => {
    service.getNotificationSummary.mockResolvedValue({ unread: 3 } as never);

    expect(await expectSuccess(await GET())).toEqual({ unread: 3 });
    expect(service.getNotificationSummary).toHaveBeenCalledWith("user-1");
  });

  it("returns 500 when the service fails", async () => {
    service.getNotificationSummary.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Failed to fetch unread notifications");
  });
});
