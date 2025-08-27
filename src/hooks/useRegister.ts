"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useRegisterUser } from "@/hooks/useUser";
import loginUIService from "@/lib/login.utils";
import { RegisterFormData, registerSchema } from "@/lib/validations/auth";

import { RegisterHandlers, RegisterState } from "../types/register.types";

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
