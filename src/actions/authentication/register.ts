"use server";
import { handleActionError } from "@/lib/auth";
import { RegisterFormData, registerSchema } from "@/lib/validations/auth";
import userServices from "@/services/user.services";
import { AuthResponse, createAuthResponse } from "@/types/response.type";

export const registerAction = async (
  userData: RegisterFormData,
): Promise<AuthResponse> => {
  try {
    const parsedData = registerSchema.safeParse(userData);
    if (!parsedData.success) {
      return createAuthResponse(false, parsedData.error.message);
    }
    const user = await userServices.createUser(parsedData.data, {
      select: {
        id: true,
      },
    });
    if (!user) {
      return createAuthResponse(false, "Failed to create user account");
    }
    return createAuthResponse(
      true,
      "Registration successful. You can now log in.",
    );
  } catch (error) {
    const errorMessage = handleActionError(error, "Registration failed");
    return createAuthResponse(false, errorMessage);
  }
};
