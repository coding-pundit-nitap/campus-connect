"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useRegisterUser } from "@/hooks/tanstack/useUser";
import loginUIService from "@/lib/utils/login.utils";
import { RegisterFormData, registerSchema } from "@/lib/validations/auth";
import { FormState } from "@/types/form.types";
import { RegisterHandlers } from "@/types/register.types";

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

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: isPending,
  };

  const handlers: RegisterHandlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),
    onNavigateToLogin: useCallback(() => {
      router.push("/login");
    }, [router]),

    onFormSubmit: useCallback(
      (data: RegisterFormData) => {
        registerUser(data);
      },
      [registerUser]
    ),
  };

  return {
    form,
    state,
    handlers,
  };
}
