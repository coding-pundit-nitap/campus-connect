import { expectError } from "@tests/helpers/api";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";

import {
  authErrorResponse,
  errorJson,
  INTERNAL_ERROR_MESSAGE,
  internalErrorResponse,
  parseShopTypeParam,
  zodErrorResponse,
} from "./route-helpers";

describe("errorJson", () => {
  it("wraps the message in an error envelope with the status", async () => {
    await expectError(errorJson("Nope", 418), 418, "Nope");
  });
});

describe("zodErrorResponse", () => {
  it("joins every issue message into a 400", async () => {
    const schema = z.object({
      a: z.string({ error: "a bad" }),
      b: z.number({ error: "b bad" }),
    });
    const { error } = schema.safeParse({});

    await expectError(zodErrorResponse(error!), 400, "a bad, b bad");
  });
});

describe("authErrorResponse", () => {
  it("maps UnauthenticatedError to 401 Unauthorized", async () => {
    await expectError(
      authErrorResponse(new UnauthenticatedError("x"))!,
      401,
      "Unauthorized"
    );
  });

  it.each([new UnauthorizedError(), new ForbiddenError()])(
    "maps %s to 403 with the default message",
    async (error) => {
      await expectError(authErrorResponse(error)!, 403, "Forbidden");
    }
  );

  it("uses a custom forbidden message", async () => {
    await expectError(
      authErrorResponse(new ForbiddenError(), "Not yours")!,
      403,
      "Not yours"
    );
  });

  it.each([new Error("db"), "string", null])(
    "returns null for other errors (%s)",
    (error) => {
      expect(authErrorResponse(error)).toBeNull();
    }
  );
});

describe("internalErrorResponse", () => {
  it("is a generic 500 that reveals nothing about the cause", async () => {
    await expectError(internalErrorResponse(), 500, INTERNAL_ERROR_MESSAGE);
    expect(INTERNAL_ERROR_MESSAGE).toBe("An internal server error occurred.");
  });
});

describe("parseShopTypeParam", () => {
  it.each([
    ["", undefined],
    ["?type=ALL", undefined],
    ["?type=", undefined],
    ["?type=CANTEEN", "CANTEEN"],
  ])("parses %s as %s", (query, expected) => {
    expect(parseShopTypeParam(new URLSearchParams(query))).toBe(expected);
  });
});
