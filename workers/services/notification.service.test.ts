import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationQueue } from "../lib/notification/notification-producer.js";
import { NotificationService } from "./notification.service.js";

vi.mock("../lib/notification/notification-producer.js", () => ({
  notificationQueue: { add: vi.fn() },
}));

describe("NotificationService.publishNotification", () => {
  beforeEach(vi.clearAllMocks);

  it("enqueues a SEND_NOTIFICATION job for the user", async () => {
    const data = { title: "Hi", message: "There" };

    await new NotificationService().publishNotification("user-1", data);

    expect(notificationQueue.add).toHaveBeenCalledWith("send-notification", {
      type: "SEND_NOTIFICATION",
      payload: { type: "SEND_NOTIFICATION", user_id: "user-1", data },
    });
  });

  it("propagates enqueue failures", async () => {
    vi.mocked(notificationQueue.add).mockRejectedValue(new Error("redis"));

    await expect(
      new NotificationService().publishNotification("u", {
        title: "t",
        message: "m",
      })
    ).rejects.toThrow("redis");
  });
});
