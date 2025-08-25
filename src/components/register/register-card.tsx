"use client";

import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import registerUIService from "@/lib/register.utils";
import { AuthProviderConfig } from "@/types/ui.types";

import { useRegister } from "../../hooks/useRegister";
import { RegisterCardConfig } from "../../types/register.types";
import { SharedAuthProviderButton } from "../shared/shared-authprovider-button";
import { Separator } from "../ui/separator";
import { RegisterFooter } from "./register-footer";
import { RegisterForm } from "./register-form";

export function RegisterCard({
  className,
  title,
  description,
}: RegisterCardConfig) {
  const config = registerUIService.getDefaultRegisterCardConfig();
  const { handlers, state } = useRegister();

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
      <RegisterForm />
      <Separator className={"my-4"} />
      <SharedAuthProviderButton
        config={googleAuthConfig}
        disabled={state.isLoading}
      />
    </SharedCard>
  );
}
