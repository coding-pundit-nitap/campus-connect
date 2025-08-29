import { signIn } from "next-auth/react";

import { FORM_FIELD_NAMES } from "@/constants";
import { LoginFormData } from "@/lib/validations/auth";
import { ButtonConfig, FormFieldConfig } from "@/types/ui.types";

/**
 * A service class to manage all business logic, event handling,
 * and configuration for the Login UI.
 */
class LoginUIService {
  /**
   * Initiates the Google authentication flow.
   */
  handleGoogleLogin = async (): Promise<void> => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Google login failed:", err);
      throw new Error("Failed to initiate Google login.");
    }
  };

  /**
   * Handles successful login events for analytics or logging.
   */
  handleLoginSuccess = (): void => {
    console.log("Login successful");
    // Example: analytics.track('LoginSuccess');
  };

  /**
   * Handles authentication errors for logging or tracking.
   */
  handleAuthError = (error: Error): void => {
    console.error("Authentication error:", error);
  };

  /**
   * Generates the configuration for the login form fields.
   */
  createLoginFormFields = (): FormFieldConfig<LoginFormData>[] => {
    return [
      {
        name: FORM_FIELD_NAMES.EMAIL,
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
        required: true,
      },
      {
        name: FORM_FIELD_NAMES.PASSWORD,
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        required: true,
      },
    ];
  };

  /**
   * Creates the configuration for the main submit button.
   * @param isLoading - The current loading state of the form.
   */
  createLoginSubmitButton = (isLoading: boolean): ButtonConfig => {
    return {
      text: `Sign In`,
      type: "submit",
      variant: "default",
      loading: isLoading,
    };
  };

  /**
   * Gets the static configuration for the login card component.
   */
  getDefaultLoginCardConfig = () => {
    return {
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Welcome Back",
      description: "Please enter your details to sign in.",
    };
  };

  /**
   * Formats an error object into a user-friendly string.
   */
  formatLoginError = (error: Error | null): string | null => {
    if (!error) return null;
    if (error.message.includes("CredentialsSignin")) {
      return "Invalid email or password. Please try again.";
    }

    return "An unexpected error occurred. Please try again later.";
  };
}

const loginUIService = new LoginUIService();

export default loginUIService;
