"use client";

import React from "react";

import { SharedAuthProviderButton } from "@/components/shared/shared-authprovider-button";
import { SharedCard } from "@/components/shared/shared-card";
import { Separator } from "@/components/ui/separator";
import { useLogin } from "@/hooks/useLoginForm";
import { loginUIService } from "@/lib/utils-functions";
import { LoginCardConfig } from "@/types/login.types";
import { AuthProviderConfig } from "@/types/ui.types";

import { LoginFooter } from "./login-footer";
import { LoginForm } from "./login-form";

export function LoginCard({ className, title, description }: LoginCardConfig) {
  const config = loginUIService.getDefaultLoginCardConfig();
  const { handlers, state } = useLogin();
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
        <LoginFooter onNavigateToRegister={handlers.onNavigateToRegister} />
      }
      className={finalConfig.className}
    >
      <LoginForm />
      <Separator className={"my-4"} />
      <SharedAuthProviderButton
        config={googleAuthConfig}
        disabled={state.isLoading}
      />
    </SharedCard>
  );
}
