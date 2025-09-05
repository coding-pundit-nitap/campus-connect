import { ButtonConfig, FormFieldConfig } from "@/types/ui.types";
import { RegisterFormData } from "@/validations/auth";

/**
 * A service class to manage all business logic, event handling,
 * and configuration for the Registration UI.
 */
class RegisterUIService {
  /**
   * Generates the configuration for the registration form fields.
   */
  createRegisterFormFields = (): FormFieldConfig<RegisterFormData>[] => {
    return [
      {
        name: "name",
        label: "Full Name",
        type: "text",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
        required: true,
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        required: true,
      },
      {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "Confirm your password",
        required: true,
      },
    ];
  };

  /**
   * Creates the configuration for the main submit button.
   * @param isLoading - The current loading state of the form.
   */
  createRegisterSubmitButton = (isLoading: boolean): ButtonConfig => {
    return {
      text: "Create Account",
      type: "submit",
      variant: "default",
      loading: isLoading,
    };
  };

  /**
   * Gets the static configuration for the registration card component.
   */
  getDefaultRegisterCardConfig = () => {
    return {
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Create an Account",
      description: "Please enter your details to get started.",
    };
  };

  /**
   * Formats an error object into a user-friendly string.
   */
  formatRegisterError = (error: Error | null): string | null => {
    if (!error) return null;
    if (error.message.includes("already exists")) {
      return "A user with this email address already exists.";
    }

    return "An unexpected error occurred. Please try again.";
  };
}

export const registerUIService = new RegisterUIService();

export default registerUIService;
