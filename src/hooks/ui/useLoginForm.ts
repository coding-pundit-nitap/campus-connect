"use client";
import { useCallback } from "react";

import { loginUIService } from "@/lib/utils";

export function useLogin() {
  const handlers = {
    onGoogleLogin: useCallback(() => {
      loginUIService.handleGoogleLogin();
    }, []),
  };

  return {
    handlers,
  };
}
