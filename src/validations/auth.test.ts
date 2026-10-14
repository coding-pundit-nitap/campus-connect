import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "./auth";

const GOOD_PW = "Str0ng!pass";
const firstMessage = (result: { success: boolean; error?: ZodError }) =>
  result.error?.issues[0]?.message;

describe("loginSchema", () => {
  it("accepts a valid email and strong password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: GOOD_PW }).success
    ).toBe(true);
  });

  it.each([
    ["not-an-email", GOOD_PW, "Email is required"],
    ["a@b.co", "", "Password is required"],
    ["a@b.co", "Ab1!", "Password must be at least 8 characters long"],
    [
      "a@b.co",
      `Ab1!${"a".repeat(130)}`,
      "Password must be at most 128 characters long",
    ],
    [
      "a@b.co",
      "alllowercase1!",
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    ],
    [
      "a@b.co",
      "NoDigits!!",
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    ],
    [
      "a@b.co",
      "NoSpecial11",
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    ],
  ])("rejects email=%j password=%j with %j", (email, password, message) => {
    expect(firstMessage(loginSchema.safeParse({ email, password }))).toBe(
      message
    );
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Asha",
    email: "a@b.co",
    password: GOOD_PW,
    confirmPassword: GOOD_PW,
  };

  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ name: "" }, "name", "Name is required"],
    [{ name: "A" }, "name", "Name must be at least 2 characters"],
    [
      { confirmPassword: "Other1!pass" },
      "confirmPassword",
      "Passwords don't match",
    ],
  ])("rejects %j at %s", (patch, path, message) => {
    const result = registerSchema.safeParse({ ...valid, ...patch });

    expect(result.error?.issues[0]).toMatchObject({ path: [path], message });
  });
});

describe("forgotPasswordSchema / resetPasswordSchema", () => {
  it("validates the email for password recovery", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(
      true
    );
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false
    );
  });

  it("requires matching new passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: GOOD_PW,
        confirmPassword: GOOD_PW,
      }).success
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ password: GOOD_PW, confirmPassword: "x" })
        .error?.issues[0]
    ).toMatchObject({
      path: ["confirmPassword"],
      message: "Passwords don't match",
    });
  });
});

describe("validate* helpers", () => {
  it.each([
    [
      "validateLogin",
      () => validateLogin({ email: "a@b.co", password: GOOD_PW }),
    ],
    [
      "validateForgotPassword",
      () => validateForgotPassword({ email: "a@b.co" }),
    ],
    [
      "validateRegister",
      () =>
        validateRegister({
          name: "Asha",
          email: "a@b.co",
          password: GOOD_PW,
          confirmPassword: GOOD_PW,
        }),
    ],
    [
      "validateResetPassword",
      () =>
        validateResetPassword({ password: GOOD_PW, confirmPassword: GOOD_PW }),
    ],
  ])("%s returns the parsed data", (_name, run) => {
    expect(run()).toEqual(expect.any(Object));
  });

  it.each([
    () => validateLogin({ email: "x", password: GOOD_PW }),
    () => validateForgotPassword({ email: "x" }),
    () =>
      validateRegister({
        name: "Asha",
        email: "a@b.co",
        password: GOOD_PW,
        confirmPassword: "different",
      }),
    () => validateResetPassword({ password: "weak", confirmPassword: "weak" }),
  ])("throws a ZodError on invalid input (#%#)", (run) => {
    expect(run).toThrow(ZodError);
  });
});
