import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { useLoginUser } from "@/hooks";
import { LoginState, LoginHandlers } from "@/types/login.types";
import loginUIService from "@/lib/login.utils";
import { useCallback } from "react";

export function useLogin() {
  const router = useRouter();
  const { mutate: loginUser, isPending, error } = useLoginUser();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const state: LoginState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: isPending,
  };

  const handlers: LoginHandlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),

    onNavigateToRegister: useCallback(() => {
      router.push("/register");
    }, [router]),

    onFormSubmit: useCallback(
      (data: LoginFormData) => {
        loginUser(data);
      },
      [loginUser]
    ),
  };

  return {
    form,
    state,
    handlers,
  };
}
