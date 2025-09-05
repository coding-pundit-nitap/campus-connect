import { RegisterFormData } from "@/validations/auth";

export interface RegisterHandlers {
  onGoogleLogin: () => void;
  onNavigateToLogin: () => void;
  onFormSubmit: (data: RegisterFormData) => void;
}
