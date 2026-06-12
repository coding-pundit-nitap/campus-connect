import { createLogger } from "@/lib/logger";

import { authClient } from "../auth-client";
const log = createLogger("login.utils");

class LoginUIService {
  handleGoogleLogin = async (): Promise<void> => {
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch (err) {
      log.error({ err: err }, "Google login failed:");
      throw new Error("Failed to initiate Google login.");
    }
  };
  getDefaultLoginCardConfig = () => {
    return {
      className: "mx-4 w-full",
      title: "Welcome",
      description: "Please sign in to continue.",
    };
  };
  formatLoginError = (error: Error | null): string | null => {
    if (!error) {
      return null;
    }
    if (error.message.includes("CredentialsSignin")) {
      return "Invalid email or password. Please try again.";
    }

    return "An unexpected error occurred. Please try again later.";
  };
}

export const loginUIService = new LoginUIService();

export default loginUIService;
