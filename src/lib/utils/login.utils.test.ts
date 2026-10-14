import { beforeEach, describe, expect, it, vi } from "vitest";

const social = vi.hoisted(() => vi.fn());

vi.mock("../auth-client", () => ({ authClient: { signIn: { social } } }));

import loginUIService, { loginUIService as named } from "./login.utils";

describe("loginUIService", () => {
  beforeEach(() => {
    social.mockReset();
  });

  it("exports one singleton", () => {
    expect(loginUIService).toBe(named);
  });

  it("starts the Google social sign-in", async () => {
    social.mockResolvedValue(undefined);

    await loginUIService.handleGoogleLogin();

    expect(social).toHaveBeenCalledWith({ provider: "google" });
  });

  it("wraps sign-in failures in a friendly error", async () => {
    social.mockRejectedValue(new Error("popup blocked"));

    await expect(loginUIService.handleGoogleLogin()).rejects.toThrow(
      "Failed to initiate Google login."
    );
  });

  it("provides the default login card config", () => {
    expect(loginUIService.getDefaultLoginCardConfig()).toEqual({
      className: "mx-4 w-full",
      title: "Welcome",
      description: "Please sign in to continue.",
    });
  });

  it.each<[Error | null, string | null]>([
    [null, null],
    [
      new Error("CredentialsSignin"),
      "Invalid email or password. Please try again.",
    ],
    [
      new Error("other"),
      "An unexpected error occurred. Please try again later.",
    ],
  ])("formatLoginError(%o) -> %s", (error, expected) => {
    expect(loginUIService.formatLoginError(error)).toBe(expected);
  });
});
