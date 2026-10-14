import { BetterAuthError } from "better-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

import { loginAction } from "./login-actions";

vi.mock("@/auth", async () => {
  const { mockOf } = await import("@tests/helpers");
  return { auth: { api: mockOf() } };
});

const signIn = vi.mocked(auth.api.signInEmail);
const credentials = { email: "user@example.com", password: "Secret123!" };

describe("loginAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("signs the user in with the parsed credentials", async () => {
    signIn.mockResolvedValue({} as never);

    const res = await loginAction(credentials);

    expect(signIn).toHaveBeenCalledWith({
      body: credentials,
      headers: expect.any(Headers),
    });
    expect(res).toEqual({ success: true, details: "Login successful" });
  });

  it("returns a failure for invalid credentials without calling the API", async () => {
    const res = await loginAction({ email: "nope", password: "" });

    expect(res.success).toBe(false);
    expect(res.details).toEqual(expect.any(String));
    expect(signIn).not.toHaveBeenCalled();
  });

  it("returns the message of a BetterAuthError", async () => {
    signIn.mockRejectedValue(new BetterAuthError("Invalid password"));

    await expect(loginAction(credentials)).resolves.toEqual({
      success: false,
      details: "Invalid password",
    });
  });

  it("returns the message of any other Error", async () => {
    signIn.mockRejectedValue(new Error("Network down"));

    await expect(loginAction(credentials)).resolves.toEqual({
      success: false,
      details: "Network down",
    });
  });

  it("falls back to a default message for non-Error throws", async () => {
    signIn.mockRejectedValue({ weird: true });

    await expect(loginAction(credentials)).resolves.toEqual({
      success: false,
      details: "Sign in failed",
    });
  });
});
