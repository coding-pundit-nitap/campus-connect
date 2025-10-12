import { LoginFormData } from "@/validations/auth";

export interface LoginCardConfig {
  className?: string;
  title?: string;
  description?: string;
}

export interface LoginFormConfig {
  onError?: (error: Error) => void;
  className?: string;
}

export interface LoginState {
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

export interface LoginHandlers {
  onGoogleLogin: () => void;
  onNavigateToRegister: () => void;
  onFormSubmit: (data: LoginFormData) => void;
}
