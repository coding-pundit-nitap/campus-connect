"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { loginUIService } from "@/lib/utils";

export function useLogin() {
  const router = useRouter();
  const handlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),
  };

  return {
    handlers,
  };
}
