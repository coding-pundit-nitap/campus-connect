import { z } from "zod";

const emailSchema = z
  .string()
  .email("Email is required")
  .min(1, "Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(6, "Password must be at least 6 characters long")
  .max(100, "Password must be at most 100 characters long");

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

export function validateLogin(data: z.infer<typeof loginSchema>) {
  return loginSchema.parse(data);
}

export function validateRegister(data: z.infer<typeof registerSchema>) {
  return registerSchema.parse(data);
}

export function validateForgotPassword(
  data: z.infer<typeof forgotPasswordSchema>
) {
  return forgotPasswordSchema.parse(data);
}

export function validateResetPassword(
  data: z.infer<typeof resetPasswordSchema>
) {
  return resetPasswordSchema.parse(data);
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
