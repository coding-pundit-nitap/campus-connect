import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { ShopFormData, shopSchema } from "@/lib/validations/shop";
import { FormState } from "@/types/form.types";

import { useShopLink } from "./tanstack/useShop";
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
    onFormSubmit: useCallback(
      (data: ShopFormData) => {
        linkShop(data);
      },
      [linkShop]
    ),
  };

  return {
    form,
    state,
    handlers,
  };
}
