"use server";

import { BetterAuthError } from "better-auth";
import { headers } from "next/headers";

import { auth } from "@/auth";
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
    await auth.api.signInEmail({
      body: {
        email: parsedData.data.email,
        password: parsedData.data.password,
      },
      headers: await headers(),
    });
    return createAuthResponse(true, "Login successful");
  } catch (error) {
    if (error instanceof BetterAuthError) {
      return createAuthResponse(false, error.message);
    }

    const errorMessage = handleActionError(error, "Sign in failed");
    return createAuthResponse(false, errorMessage);
  }
};
