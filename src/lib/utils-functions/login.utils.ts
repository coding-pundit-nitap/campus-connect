import { signIn } from "next-auth/react";

class LoginUIService {
  handleGoogleLogin = async (): Promise<void> => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Google login failed:", err);
      throw new Error("Failed to initiate Google login.");
    }
  };
  getDefaultLoginCardConfig = () => {
    return {
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Welcome Back",
      description: "Please enter your details to sign in.",
    };
  };
  formatLoginError = (error: Error | null): string | null => {
    if (!error) return null;
    if (error.message.includes("CredentialsSignin")) {
      return "Invalid email or password. Please try again.";
    }

    return "An unexpected error occurred. Please try again later.";
  };
}

export const loginUIService = new LoginUIService();

export default loginUIService;
