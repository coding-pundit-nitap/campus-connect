"use client";

import React from "react";
import { SharedForm } from "@/components/shared/shared-form";
import { LoginFormConfig } from "../../types/login.types";
import { useLogin } from "../../hooks/useLogin";
import loginUIService from "@/lib/login.utils";
export function LoginForm({ className = "" }: LoginFormConfig) {
  const { form, state, handlers } = useLogin();

  const formFields = loginUIService.createLoginFormFields();
  const submitButton = loginUIService.createLoginSubmitButton(state.isLoading);
  const formattedError = loginUIService.formatLoginError(
    state.error ? new Error(state.error) : null,
  );

  const submitHandler = form.handleSubmit(handlers.onFormSubmit);

  return (
    <SharedForm
      form={form}
      fields={formFields}
      submitButton={submitButton}
      onSubmit={submitHandler}
      isLoading={state.isLoading}
      error={formattedError}
      className={className}
    />
  );
}
