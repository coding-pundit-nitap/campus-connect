import { RegisterFormData } from "@/lib/validations/auth";

export interface RegisterCardConfig {
  className?: string;
  title?: string;
  description?: string;
}

export interface RegisterFormConfig {
  onError?: (error: Error) => void;
  className?: string;
}

export interface RegisterState {
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

export interface RegisterHandlers {
  onGoogleLogin: () => void;
  onNavigateToLogin: () => void;
  onFormSubmit: (data: RegisterFormData) => void;
}
