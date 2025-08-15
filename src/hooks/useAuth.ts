"use client";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = useCallback(
    (
      onSubmit: (data: LoginFormData) => Promise<void> | void,
      onError?: (error: Error) => void,
    ) => {
      return form.handleSubmit(async (data) => {
        try {
          setIsLoading(true);
          setError(null);
          await onSubmit(data);
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
    error,
    handleSubmit,
  };
}
