"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useShopLink } from "@/hooks";
import { FormState } from "@/types";
import { ShopFormData, shopSchema } from "@/validations/shop";

export function useLinkShop() {
  const { mutate: linkShop, isPending, error } = useShopLink();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      opening: "",
      closing: "",
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: isPending,
  };

  const handlers = {
    onSubmit: form.handleSubmit((data: ShopFormData) => {
      linkShop(data);
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
