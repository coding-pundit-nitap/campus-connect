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
import { UnauthenticatedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const service = vi.mocked(notificationService);

describe("GET /api/notifications/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserData.mockResolvedValue({ id: "user-1" } as never);
  });

  it("returns notifications merged with broadcasts for the parsed page", async () => {
    service.getAllNotificationsWithBroadcasts.mockResolvedValue({
      data: [],
    } as never);

    const data = await expectSuccess(
      await GET(makeRequest("/api/notifications/history?limit=5&cursor=c1"))
    );

    expect(data).toEqual({ data: [] });
    expect(service.getAllNotificationsWithBroadcasts).toHaveBeenCalledWith(
      "user-1",
      5,
      "c1"
    );
  });

  it("returns 400 with the zod message for a non-numeric limit", async () => {
    await expectError(
      await GET(makeRequest("/api/notifications/history?limit=abc")),
      400,
      "limit must be a number"
    );
  });

  it("returns 401 when not signed in", async () => {
    auth.getUserData.mockRejectedValue(new UnauthenticatedError("Sign in"));

    await expectError(
      await GET(makeRequest("/api/notifications/history")),
      401,
      "Sign in"
    );
  });

  it("returns 500 on unexpected errors", async () => {
    service.getAllNotificationsWithBroadcasts.mockRejectedValue(new Error("x"));

    await expectError(
      await GET(makeRequest("/api/notifications/history")),
      500,
      "Failed to fetch notifications"
    );
  });
});
