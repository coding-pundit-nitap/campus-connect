"use client";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, RegisterFormData, registerSchema, type LoginFormData } from "@/lib/validations/auth";
import { AuthResponse } from "@/types/response.type";

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = useCallback(
    (
      onSubmit: (data: LoginFormData) => Promise<AuthResponse>,
      onError?: (error: Error) => void,
    ) => {
      return form.handleSubmit(async (data) => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await onSubmit(data);
          if (response.success) {
            setSuccess(response.message);
          } else {
            setError(response.message);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An error occurred";
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
          setIsLoading(false);
        }
      });
    },
    [form],
  );

  return {
    form,
    isLoading,
    success,
    error,
    handleSubmit,
  };
}
export function useRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = useCallback(
    (
      onSubmit: (data: RegisterFormData) => Promise<AuthResponse>,
      onError?: (error: Error) => void,
    ) => {
      return form.handleSubmit(async (data) => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await onSubmit(data);
          if (response.success) {
            setSuccess(response.message);
          } else {
            setError(response.message);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An error occurred";
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
          setIsLoading(false);
        }
      });
    },
    [form],
  );

  return {
    form,
    isLoading,
    success,
    error,
    handleSubmit,
  };
}
