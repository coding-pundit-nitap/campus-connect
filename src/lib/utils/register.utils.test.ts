import { describe, expect, it } from "vitest";

import registerUIService, {
  registerUIService as named,
} from "./register.utils";

describe("registerUIService", () => {
  it("exports one singleton", () => {
    expect(registerUIService).toBe(named);
  });

  it("provides the default register card config", () => {
    expect(registerUIService.getDefaultRegisterCardConfig()).toEqual({
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Create an Account",
      description: "Please enter your details to get started.",
    });
  });

  it.each<[Error | null, string | null]>([
    [null, null],
    [
      new Error("User already exists"),
      "A user with this email address already exists.",
    ],
    [new Error("boom"), "An unexpected error occurred. Please try again."],
  ])("formatRegisterError(%o) -> %s", (error, expected) => {
    expect(registerUIService.formatRegisterError(error)).toBe(expected);
  });
});
