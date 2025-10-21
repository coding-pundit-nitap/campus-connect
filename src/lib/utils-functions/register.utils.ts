class RegisterUIService {
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
