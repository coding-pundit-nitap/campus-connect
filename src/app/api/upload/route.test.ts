import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/notification/notification-producer", () => ({
  NOTIFICATION_QUEUE_NAME: "notification-queue",
  notificationQueue: { add: vi.fn().mockResolvedValue({}) },
}));
vi.mock("@/lib/audit/audit-producer", () => ({
  AUDIT_QUEUE_NAME: "audit-log-queue",
  auditQueue: { add: vi.fn().mockResolvedValue({}) },
}));

import * as uploadRoute from "./route";

describe("DELETE /api/upload", () => {
  it("no longer exists as a route handler", () => {
    expect(uploadRoute).not.toHaveProperty("DELETE");
  });

  it("POST (the real, live upload-URL flow) is still present", () => {
    expect(typeof uploadRoute.POST).toBe("function");
  });
});
