"use client";
import React from "react";

import { SharedForm } from "@/components/shared/shared-form";
import { useLinkShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils-functions";
interface ShopFormConfig {
  className?: string;
}

export default function ShopForm({ className }: ShopFormConfig) {
  const { form, state, handlers } = useLinkShop();
  const formFields = shopUIServices.createShopLinkFormFields();
  const submitButton = shopUIServices.createShopSubmitButton(state.isLoading);
  const submitHandler = form.handleSubmit(handlers.onFormSubmit);

  return (
    <SharedForm
      form={form}
      fields={formFields}
      submitButton={submitButton}
      onSubmit={submitHandler}
      isLoading={state.isLoading}
      error={state.error}
      className={className}
    />
  );
}
