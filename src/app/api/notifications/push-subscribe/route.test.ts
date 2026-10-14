import { makeRequest } from "@tests/helpers";
import { asMock } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { UnauthenticatedError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { DELETE, POST } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);

const subscription = {
  endpoint: "https://push.example/abc",
  keys: { p256dh: "pk", auth: "secret" },
};

const post = (body: unknown) =>
  POST(
    makeRequest("/api/notifications/push-subscribe", { method: "POST", body })
  );
const del = (query = "") =>
  DELETE(
    makeRequest(`/api/notifications/push-subscribe${query}`, {
      method: "DELETE",
    })
  );

async function expectText(res: Response, status: number, text: string) {
  expect(res.status).toBe(status);
  expect(await res.text()).toBe(text);
}

describe("POST /api/notifications/push-subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("upserts the subscription for the user", async () => {
    const res = await post(subscription);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint },
      update: { user_id: "user-1", p256dh: "pk", auth: "secret" },
      create: {
        user_id: "user-1",
        endpoint: subscription.endpoint,
        p256dh: "pk",
        auth: "secret",
      },
    });
  });

  it.each([
    ["null body", null],
    ["missing endpoint", { keys: subscription.keys }],
    ["missing keys", { endpoint: subscription.endpoint }],
  ])("returns 400 for %s", async (_label, body) => {
    await expectText(await post(body), 400, "Invalid subscription format");
  });

  it.each([
    ["p256dh", { auth: "secret" }],
    ["auth", { p256dh: "pk" }],
  ])("returns 400 when keys.%s is missing", async (_label, keys) => {
    await expectText(
      await post({ endpoint: subscription.endpoint, keys }),
      400,
      "Invalid subscription keys"
    );
  });

  it("returns 401 when not signed in", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectText(await post(subscription), 401, "Unauthorized");
  });

  it("returns 500 when saving fails", async () => {
    db.pushSubscription.upsert.mockRejectedValue(new Error("db"));

    await expectText(await post(subscription), 500, "Internal Server Error");
  });
});

describe("DELETE /api/notifications/push-subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("deletes the user's subscription for the endpoint", async () => {
    const res = await del("?endpoint=e1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: "e1", user_id: "user-1" },
    });
  });

  it("returns 400 without an endpoint", async () => {
    await expectText(await del(), 400, "Missing endpoint");
  });

  it("returns 401 when not signed in", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectText(await del("?endpoint=e1"), 401, "Unauthorized");
  });

  it("returns 500 when deleting fails", async () => {
    db.pushSubscription.deleteMany.mockRejectedValue(new Error("db"));

    await expectText(await del("?endpoint=e1"), 500, "Internal Server Error");
  });
});
