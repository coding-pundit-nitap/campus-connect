import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/constants";

export const emailSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
  .email(VALIDATION_MESSAGES.EMAIL_INVALID);

export const passwordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
  .min(6, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .max(100, VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
