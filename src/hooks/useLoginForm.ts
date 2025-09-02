"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useLoginUser } from "@/hooks";
import { loginUIService } from "@/lib/utils-functions";
import { FormState, LoginHandlers } from "@/types";
import { LoginFormData, loginSchema } from "@/validations/auth";

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

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
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
