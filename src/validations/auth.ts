import { z } from "zod";

export class AuthValidation {
  static readonly emailSchema = z
    .string()
    .email("Email is required")
    .min(1, "Please enter a valid email address");

  static readonly passwordSchema = z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be at most 100 characters long");

  static readonly loginSchema = z.object({
    email: this.emailSchema,
    password: this.passwordSchema,
  });

  static readonly registerSchema = z
    .object({
      name: z
        .string()
        .min(1, "Name is required")
        .min(2, "Name must be at least 2 characters"),
      email: this.emailSchema,
      password: this.passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  static readonly forgotPasswordSchema = z.object({
    email: this.emailSchema,
  });

  static readonly resetPasswordSchema = z
    .object({
      password: this.passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  static validateLogin(data: z.infer<typeof this.loginSchema>) {
    return this.loginSchema.parse(data);
  }

  static validateRegister(data: z.infer<typeof this.registerSchema>) {
    return this.registerSchema.parse(data);
  }

  static validateForgotPassword(
    data: z.infer<typeof this.forgotPasswordSchema>
  ) {
    return this.forgotPasswordSchema.parse(data);
  }

  static validateResetPassword(data: z.infer<typeof this.resetPasswordSchema>) {
    return this.resetPasswordSchema.parse(data);
  }
}

export const loginSchema = AuthValidation.loginSchema;
export const registerSchema = AuthValidation.registerSchema;
export const forgotPasswordSchema = AuthValidation.forgotPasswordSchema;
export const resetPasswordSchema = AuthValidation.resetPasswordSchema;

export type LoginFormData = z.infer<typeof AuthValidation.loginSchema>;
export type RegisterFormData = z.infer<typeof AuthValidation.registerSchema>;
export type ForgotPasswordFormData = z.infer<
  typeof AuthValidation.forgotPasswordSchema
>;
export type ResetPasswordFormData = z.infer<
  typeof AuthValidation.resetPasswordSchema
>;
