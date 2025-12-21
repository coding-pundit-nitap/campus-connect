"use client";

import React, { useCallback } from "react";

import { SharedAuthProviderButton } from "@/components/shared/shared-authprovider-button";
import { SharedCard } from "@/components/shared/shared-card";
import { loginUIService } from "@/lib/utils";
import { LoginCardConfig } from "@/types/login.types";
import { AuthProviderConfig } from "@/types/ui.types";

export function LoginCard({ className, title, description }: LoginCardConfig) {
  const config = loginUIService.getDefaultLoginCardConfig();

  const handleGoogleLogin = useCallback(() => {
    loginUIService.handleGoogleLogin();
  }, []);

  const googleAuthConfig: AuthProviderConfig = {
    provider: "google",
    iconSrc: "/svg/google-icon.svg",
    label: "Sign in with Google",
    onClick: handleGoogleLogin,
  };

  const finalConfig = {
    className: className || config.className,
    title: title || config.title,
    description: description || config.description,
  };

  return (
    <SharedCard
      title={finalConfig.title}
      description={finalConfig.description}
      showHeader={true}
      showFooter={true}
      className={finalConfig.className}
    >
      <SharedAuthProviderButton config={googleAuthConfig} />
    </SharedCard>
  );
}
