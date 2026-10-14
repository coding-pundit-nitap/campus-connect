import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  create: vi.fn((config: object) => ({ defaults: config })),
}));

vi.mock("@/config/env.config", () => ({ env: mocks.env }));
vi.mock("axios", () => ({ default: { create: mocks.create } }));

const loadClient = async () => (await import("./axios")).default;

describe("axios instance", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.create.mockClear();
    for (const key of Object.keys(mocks.env)) delete mocks.env[key];
  });

  it("targets NEXT_PUBLIC_API_URL with JSON headers and a 10s timeout", async () => {
    mocks.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

    const client = await loadClient();

    expect(mocks.create).toHaveBeenCalledWith({
      baseURL: "https://api.example.com",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    expect(client).toEqual({ defaults: mocks.create.mock.calls[0][0] });
  });

  it("falls back to /api when no API URL is configured", async () => {
    await loadClient();

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "/api" })
    );
  });
});
