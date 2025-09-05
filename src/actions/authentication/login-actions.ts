"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { handleActionError } from "@/lib/auth";
import { AuthResponse, createAuthResponse } from "@/types/response.types";
import { LoginFormData, loginSchema } from "@/validations/auth";

export const loginAction = async (
  credentials: LoginFormData
): Promise<AuthResponse> => {
  try {
    const parsedData = loginSchema.safeParse(credentials);
    if (!parsedData.success) {
      return createAuthResponse(false, parsedData.error.message);
    }
    await signIn("credentials", { ...parsedData.data, redirect: false });
    return createAuthResponse(true, "Login successful");
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return createAuthResponse(false, "Invalid credentials");
        case "AccessDenied":
          return createAuthResponse(
            false,
            "Access denied. Please verify your email first."
          );
        default:
          return createAuthResponse(false, "An authentication error occurred");
      }
    }
    const errorMessage = handleActionError(error, "Sign in failed");
    return createAuthResponse(false, errorMessage);
  }
};
