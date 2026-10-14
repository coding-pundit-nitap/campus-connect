import { describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => handlers),
}));
vi.mock("@/auth", () => ({ auth: { id: "auth-instance" } }));

import { toNextJsHandler } from "better-auth/next-js";

import { GET, POST } from "./route";

describe("/api/auth/[...all]", () => {
  it("exposes better-auth's Next.js GET and POST handlers", () => {
    expect(toNextJsHandler).toHaveBeenCalledWith({ id: "auth-instance" });
    expect(GET).toBe(handlers.GET);
    expect(POST).toBe(handlers.POST);
  });
});
