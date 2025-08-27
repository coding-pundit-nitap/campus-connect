"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useLoginUser } from "@/hooks/useUser";
import loginUIService from "@/lib/login.utils";
import { LoginFormData, loginSchema } from "@/lib/validations/auth";
import { LoginHandlers, LoginState } from "@/types/login.types";

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
