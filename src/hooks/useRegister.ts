import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterFormData } from "@/lib/validations/auth";
import { useRegisterUser } from "@/hooks";
import { RegisterState, RegisterHandlers } from "../types/register.types";
import registerUIService from "@/lib/register.utils";
import loginUIService from "@/lib/login.utils";

export function useRegister() {
  const router = useRouter();
  const { mutate: registerUser, isPending, error } = useRegisterUser();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    },
  });

  const state: RegisterState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: isPending,
  };

  const handlers: RegisterHandlers = {
    onGoogleLogin: loginUIService.handleGoogleLogin,
    onNavigateToLogin: registerUIService.handleNavigateToLogin(router),
    onFormSubmit: registerUIService.handleRegisterFormSubmit(registerUser),
  };

  return {
    form,
    state,
    handlers,
  };
}
