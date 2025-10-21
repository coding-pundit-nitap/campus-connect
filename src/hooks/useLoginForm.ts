"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { loginUIService } from "@/lib/utils-functions";

export function useLogin() {
  const router = useRouter();
  const handlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),

    onNavigateToRegister: useCallback(() => {
      router.push("/register");
    }, [router]),
  };

  return {
    handlers,
  };
}
