import { makeRequest } from "@tests/helpers";
import { expectError } from "@tests/helpers/api";
import { describe, it } from "vitest";

import { POST } from "./route";

describe("POST /api/auth/register", () => {
  it("returns 410 because password registration is disabled", async () => {
    await expectError(
      await POST(makeRequest("/api/auth/register", { method: "POST" })),
      410,
      /Registration is disabled/
    );
  });
});
