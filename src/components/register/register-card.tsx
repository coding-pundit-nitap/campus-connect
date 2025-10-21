"use client";

import React from "react";

import { SharedAuthProviderButton } from "@/components/shared/shared-authprovider-button";
import { SharedCard } from "@/components/shared/shared-card";
import { useRegister } from "@/hooks/useRegisterForm";
import { registerUIService } from "@/lib/utils-functions";
import { AuthProviderConfig } from "@/types";

import { RegisterFooter } from "./register-footer";

export interface RegisterCardConfig {
  className?: string;
  title?: string;
  description?: string;
}

export function RegisterCard({
  className,
  title,
  description,
}: RegisterCardConfig) {
  const config = registerUIService.getDefaultRegisterCardConfig();
  const { handlers } = useRegister();

  const googleAuthConfig: AuthProviderConfig = {
    provider: "google",
    iconSrc: "/svg/google-icon.svg",
    label: "Sign in with Google",
    onClick: handlers.onGoogleLogin,
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
      footerContent={
        <RegisterFooter onNavigateToLogin={handlers.onNavigateToLogin} />
      }
      className={finalConfig.className}
    >
      <SharedAuthProviderButton config={googleAuthConfig} />
    </SharedCard>
  );
}
