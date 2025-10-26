"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { loginUIService } from "@/lib/utils";

export function useRegister() {
  const router = useRouter();
  const handlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),
    onNavigateToLogin: useCallback(() => {
      router.push("/login");
    }, [router]),
  };

  return {
    handlers,
  };
}
