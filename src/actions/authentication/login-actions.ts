"use server";
import { signIn } from "@/auth";
import { handleActionError } from "@/lib/auth";
import { LoginFormData, loginSchema } from "@/lib/validations/auth";
import { AuthResponse, createAuthResponse } from "@/types/response.type";
import { AuthError } from "next-auth";

/**
 * Authenticates a user with email and password credentials using NextAuth.
 *
 * This server action validates the provided credentials, attempts to sign in the user,
 * and returns an appropriate response based on the authentication result.
 *
 * @param credentials - The user's login credentials
 * @param credentials.email - The user's email address
 * @param credentials.password - The user's password
 *
 * @returns A promise that resolves to an AuthResponse object containing:
 *   - success: boolean indicating if login was successful
 *   - details: string message describing the result or error
 *
 * @throws {AuthError} When NextAuth encounters authentication errors
 *
 * @example
 * ```typescript
 * const result = await loginAction({
 *   email: "user@example.com",
 *   password: "securePassword123"
 * });
 *
 * if (result.success) {
 *   console.log("Login successful:", result.details);
 * } else {
 *   console.error("Login failed:", result.details);
 * }
 * ```
 *
 * @remarks
 * - Validates input using loginSchema before attempting authentication
 * - Handles various AuthError types with specific error messages
 * - Uses NextAuth's "credentials" provider for authentication
 * - Does not redirect automatically (redirect: false)
 * - Returns user-friendly error messages for different failure scenarios
 *
 * @see {@link loginSchema} for input validation rules
 * @see {@link createAuthResponse} for response structure
 */
export const loginAction = async (
  credentials: LoginFormData,
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
            "Access denied. Please verify your email first.",
          );
        default:
          return createAuthResponse(false, "An authentication error occurred");
      }
    }
    const errorMessage = handleActionError(error, "Sign in failed");
    return createAuthResponse(false, errorMessage);
  }
};
