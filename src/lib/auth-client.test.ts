import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  createAuthClient: vi.fn((options: { baseURL: string }) => ({
    options,
    signIn: { social: vi.fn() },
    signOut: vi.fn(),
    useSession: vi.fn(),
    updateUser: vi.fn(),
  })),
}));

vi.mock("@/config/env.config", () => ({ env: mocks.env }));
vi.mock("better-auth/react", () => ({
  createAuthClient: mocks.createAuthClient,
}));
vi.mock("better-auth/client/plugins", () => ({
  inferAdditionalFields: () => "additional-fields-plugin",
}));

const load = async () => import("./auth-client");
const baseURL = () => mocks.createAuthClient.mock.calls[0][0].baseURL as string;

describe("authClient", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createAuthClient.mockClear();
    delete mocks.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the browser origin when running in a browser", async () => {
    vi.stubGlobal("window", { location: { origin: "https://campus.test" } });

    await load();

    expect(baseURL()).toBe("https://campus.test");
  });

  it("uses NEXT_PUBLIC_APP_URL on the server", async () => {
    mocks.env.NEXT_PUBLIC_APP_URL = "https://connect.example";

    await load();

    expect(baseURL()).toBe("https://connect.example");
  });

  it("falls back to an empty base URL when nothing is configured", async () => {
    await load();

    expect(baseURL()).toBe("");
  });

  it("registers the additional-fields plugin and re-exports client methods", async () => {
    const mod = await load();

    expect(mocks.createAuthClient.mock.calls[0][0]).toMatchObject({
      plugins: ["additional-fields-plugin"],
    });
    expect(mod.signIn).toBe(mod.authClient.signIn);
    expect(mod.signOut).toBe(mod.authClient.signOut);
    expect(mod.useSession).toBe(mod.authClient.useSession);
    expect(mod.updateUser).toBe(mod.authClient.updateUser);
  });
});
