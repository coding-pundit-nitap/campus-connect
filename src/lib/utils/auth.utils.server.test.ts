import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: { api: { getSession } } }));

import { UnauthenticatedError, UnauthorizedError } from "@/lib/custom-error";

import authUtils, { authUtils as namedAuthUtils } from "./auth.utils.server";

const sessionFor = (user: Record<string, unknown> | null) =>
  getSession.mockResolvedValue(
    user === null ? null : { user: { status: "ACTIVE", ...user } }
  );

describe("authUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the same singleton as default and named export", () => {
    expect(authUtils).toBe(namedAuthUtils);
  });

  describe("getUserData", () => {
    it("returns the session user, forwarding request headers", async () => {
      sessionFor({ id: "u-1" });

      await expect(authUtils.getUserData()).resolves.toEqual({
        id: "u-1",
        status: "ACTIVE",
      });
      expect(getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
        query: { disableCookieCache: true },
      });
    });

    it.each(["SUSPENDED", "BANNED"])(
      "rejects a %s user even with a live session",
      async (status) => {
        sessionFor({ id: "u-1", status });

        await expect(authUtils.getUserData()).rejects.toThrow(
          new UnauthenticatedError("Your account is not active.")
        );
      }
    );

    it.each([
      ["no session", null],
      ["no user", {}],
      ["no user id", { user: { id: "" } }],
    ])("throws UnauthenticatedError with %s", async (_label, session) => {
      getSession.mockResolvedValue(session);

      await expect(authUtils.getUserData()).rejects.toThrow(
        new UnauthenticatedError("Please log in first.")
      );
    });
  });

  describe("isAuthenticated", () => {
    it("is true with a session", async () => {
      sessionFor({ id: "u-1" });

      await expect(authUtils.isAuthenticated()).resolves.toBe(true);
    });

    it("is false without a session", async () => {
      sessionFor(null);

      await expect(authUtils.isAuthenticated()).resolves.toBe(false);
    });

    it("rethrows unexpected errors", async () => {
      getSession.mockRejectedValue(new Error("auth backend down"));

      await expect(authUtils.isAuthenticated()).rejects.toThrow(
        "auth backend down"
      );
    });
  });

  describe("getUserId", () => {
    it("returns the user id", async () => {
      sessionFor({ id: "u-1" });

      await expect(authUtils.getUserId()).resolves.toBe("u-1");
    });

    it("throws UnauthenticatedError if getUserData yields no id", async () => {
      const spy = vi
        .spyOn(authUtils, "getUserData")
        .mockResolvedValueOnce(
          {} as Awaited<ReturnType<typeof authUtils.getUserData>>
        );

      await expect(authUtils.getUserId()).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
      spy.mockRestore();
    });
  });

  it("unAuthorized throws UnauthorizedError", () => {
    expect(() => authUtils.unAuthorized()).toThrow(
      new UnauthorizedError("User not authorized")
    );
  });

  it.each([
    [{ id: "u", shop_id: "s-1" }, true],
    [{ id: "u", shop_id: null }, false],
  ])("isSeller for %j is %s", async (user, expected) => {
    sessionFor(user);

    await expect(authUtils.isSeller()).resolves.toBe(expected);
  });

  describe("getOwnedShopId", () => {
    it("returns the owned shop id", async () => {
      sessionFor({ id: "u", shop_id: "s-1" });

      await expect(authUtils.getOwnedShopId()).resolves.toBe("s-1");
    });

    it("throws UnauthorizedError for users without a shop", async () => {
      sessionFor({ id: "u", shop_id: null });

      await expect(authUtils.getOwnedShopId()).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  it.each([
    ["ADMIN", true],
    ["USER", false],
  ])("isAdmin for role %s is %s", async (role, expected) => {
    sessionFor({ id: "u", role });

    await expect(authUtils.isAdmin()).resolves.toBe(expected);
  });
});
