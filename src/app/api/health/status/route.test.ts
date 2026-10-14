import { readJson } from "@tests/helpers";
import { describe, expect, it } from "vitest";

import { GET, HEAD } from "./route";

describe("/api/health/status", () => {
  it("GET reports healthy", async () => {
    expect(await readJson(await GET())).toEqual({
      status: 200,
      body: { status: "healthy" },
    });
  });

  it("HEAD returns 200", async () => {
    expect((await HEAD()).status).toBe(200);
  });
});
