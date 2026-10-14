import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { verifyAdmin } from "@/lib/verify-admin";

import {
  cursorArgs,
  dateRange,
  groupCount,
  runAdminAction,
  toCursorPage,
} from "./_shared";

vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

describe("admin action helpers", () => {
  const log = { error: vi.fn() };
  const options = { label: "LABEL:", fallback: "Fallback message." };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue("admin-1");
  });

  describe("runAdminAction", () => {
    it("passes the verified admin id to the action and returns its result", async () => {
      const fn = vi.fn().mockResolvedValue("result");

      const result = await runAdminAction(log, options, fn);

      expect(fn).toHaveBeenCalledWith("admin-1");
      expect(result).toBe("result");
      expect(log.error).not.toHaveBeenCalled();
    });

    it("does not run the action when verifyAdmin fails", async () => {
      vi.mocked(verifyAdmin).mockRejectedValueOnce(new ForbiddenError());
      const fn = vi.fn();

      await expect(runAdminAction(log, options, fn)).rejects.toThrow(
        ForbiddenError
      );
      expect(fn).not.toHaveBeenCalled();
    });

    it.each([
      ["UnauthorizedError", new UnauthorizedError()],
      ["ForbiddenError", new ForbiddenError()],
      ["BadRequestError", new BadRequestError("bad input")],
    ])("rethrows %s unchanged and logs it", async (_name, error) => {
      await expect(
        runAdminAction(log, options, () => Promise.reject(error))
      ).rejects.toBe(error);
      expect(log.error).toHaveBeenCalledWith({ err: error }, "LABEL:");
    });

    it("rethrows passthrough errors unchanged", async () => {
      const error = new NotFoundError("missing");

      await expect(
        runAdminAction(log, { ...options, passthrough: [NotFoundError] }, () =>
          Promise.reject(error)
        )
      ).rejects.toBe(error);
    });

    it("wraps non-passthrough errors in InternalServerError with the fallback", async () => {
      const promise = runAdminAction(
        log,
        { ...options, passthrough: [NotFoundError] },
        () => Promise.reject(new Error("db down"))
      );

      await expect(promise).rejects.toThrow(InternalServerError);
      await expect(promise).rejects.toThrow("Fallback message.");
    });
  });

  describe("cursorArgs", () => {
    it("requests one extra row and starts from the beginning without cursor", () => {
      expect(cursorArgs(10)).toEqual({ take: 11, skip: 0, cursor: undefined });
    });

    it("skips the cursor row when a cursor is given", () => {
      expect(cursorArgs(5, "c1")).toEqual({
        take: 6,
        skip: 1,
        cursor: { id: "c1" },
      });
    });
  });

  describe("toCursorPage", () => {
    it("returns all rows and no cursor when there is no extra row", () => {
      const rows = [{ id: "a" }, { id: "b" }];

      expect(toCursorPage(rows, 2)).toEqual({
        data: rows,
        nextCursor: null,
        hasMore: false,
      });
    });

    it("drops the extra row and points the cursor at the last kept row", () => {
      const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

      expect(toCursorPage(rows, 2)).toEqual({
        data: [{ id: "a" }, { id: "b" }],
        nextCursor: "b",
        hasMore: true,
      });
    });
  });

  describe("dateRange", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-02-01");

    it.each([
      ["no bound", undefined, undefined, undefined],
      ["only start", start, undefined, { gte: start }],
      ["only end", undefined, end, { lte: end }],
      ["both bounds", start, end, { gte: start, lte: end }],
    ])("handles %s", (_name, from, to, expected) => {
      expect(dateRange(from, to)).toEqual(expected);
    });
  });

  describe("groupCount", () => {
    it.each([
      ["a count object", { rating: 3 }, 3],
      ["a missing key", {}, 0],
      ["a non-object count", true, 0],
      ["an undefined count", undefined, 0],
    ])("reads %s", (_name, count, expected) => {
      expect(groupCount(count, "rating")).toBe(expected);
    });
  });
});
