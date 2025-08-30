import { RegisterFormData } from "@/lib/validations/auth";

export interface RegisterHandlers {
  onGoogleLogin: () => void;
  onNavigateToLogin: () => void;
  onFormSubmit: (data: RegisterFormData) => void;
}
