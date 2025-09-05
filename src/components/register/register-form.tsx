"use client";

import React from "react";

import { SharedForm } from "@/components/shared/shared-form";
import { useRegister } from "@/hooks";
import { registerUIService } from "@/lib/utils-functions";

interface RegisterFormConfig {
  className?: string;
}
export function RegisterForm({ className = "" }: RegisterFormConfig) {
  const { form, state, handlers } = useRegister();

  const formFields = registerUIService.createRegisterFormFields();
  const submitButton = registerUIService.createRegisterSubmitButton(
    state.isLoading
  );
  const formattedError = registerUIService.formatRegisterError(
    state.error ? new Error(state.error) : null
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
