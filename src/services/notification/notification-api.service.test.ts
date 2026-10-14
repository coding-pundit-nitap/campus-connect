import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { notificationAPIService } from "./notification-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("notificationAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchNotificationHistory defaults limit and drops null cursor", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await notificationAPIService.fetchNotificationHistory({ cursor: null });

    expect(axios.get).toHaveBeenCalledWith("notifications/history", {
      params: { limit: 20, cursor: undefined },
    });
  });

  it("fetchNotificationHistory forwards limit and cursor", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await notificationAPIService.fetchNotificationHistory({
      limit: 5,
      cursor: "c1",
    });

    expect(axios.get).toHaveBeenCalledWith("notifications/history", {
      params: { limit: 5, cursor: "c1" },
    });
  });

  it.each([{}, { notificationIds: [], broadcastIds: [] }])(
    "markAsRead skips the request when nothing is selected (%j)",
    async (data) => {
      await notificationAPIService.markAsRead(data);

      expect(axios.patch).not.toHaveBeenCalled();
    }
  );

  it.each([{ notificationIds: ["n1"] }, { broadcastIds: ["b1"] }])(
    "markAsRead patches when ids are present (%j)",
    async (data) => {
      await notificationAPIService.markAsRead(data);

      expect(axios.patch).toHaveBeenCalledWith(
        "notifications/mark-as-read",
        data
      );
    }
  );

  it("fetchNotificationSummary unwraps the summary", async () => {
    axios.get.mockResolvedValue(envelope({ unreadCount: { total: 1 } }));

    await expect(
      notificationAPIService.fetchNotificationSummary()
    ).resolves.toEqual({ unreadCount: { total: 1 } });
    expect(axios.get).toHaveBeenCalledWith("notifications/summary", undefined);
  });

  it("subscribePush posts the subscription", async () => {
    const sub = { endpoint: "https://push" };

    await notificationAPIService.subscribePush(sub);

    expect(axios.post).toHaveBeenCalledWith(
      "notifications/push-subscribe",
      sub
    );
  });

  it("unsubscribePush deletes by endpoint", async () => {
    await notificationAPIService.unsubscribePush("https://push");

    expect(axios.delete).toHaveBeenCalledWith("notifications/push-subscribe", {
      params: { endpoint: "https://push" },
    });
  });
});
