import { describe, expect, it } from "vitest";

import * as uploadRoute from "./route";

describe("DELETE /api/upload", () => {
  it("no longer exists as a route handler", () => {
    expect(uploadRoute).not.toHaveProperty("DELETE");
  });

  it("POST (the real, live upload-URL flow) is still present", () => {
    expect(typeof uploadRoute.POST).toBe("function");
  });
});
