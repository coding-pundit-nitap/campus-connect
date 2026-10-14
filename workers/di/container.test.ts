import { describe, expect, it, vi } from "vitest";

import { BatchService } from "../services/batch.service.js";
import { NotificationService } from "../services/notification.service.js";
import { batchService, notificationService } from "./container.js";

vi.mock("../services/notification.service.js", () => ({
  NotificationService: vi.fn(function NotificationService() {}),
}));
vi.mock("../services/batch.service.js", () => ({
  BatchService: vi.fn(function BatchService() {}),
}));

describe("workers DI container", () => {
  it("builds one NotificationService and injects it into BatchService", () => {
    expect(NotificationService).toHaveBeenCalledTimes(1);
    expect(notificationService).toBeInstanceOf(NotificationService);
    expect(BatchService).toHaveBeenCalledWith(notificationService);
    expect(batchService).toBeInstanceOf(BatchService);
  });
});
