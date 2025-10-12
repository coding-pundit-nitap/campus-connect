import { ButtonConfig, FormFieldConfig } from "@/types/ui.types";
import { RegisterFormData } from "@/validations/auth";

class RegisterUIService {
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

  createRegisterSubmitButton = (isLoading: boolean): ButtonConfig => {
    return {
      text: "Create Account",
      type: "submit",
      variant: "default",
      loading: isLoading,
    };
  };

  getDefaultRegisterCardConfig = () => {
    return {
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Create an Account",
      description: "Please enter your details to get started.",
    };
  };

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
