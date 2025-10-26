"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useShopLink, useShopUpdate } from "@/hooks";
import { authClient } from "@/lib/auth-client";
import { FormState } from "@/types";
import { ShopWithOwner } from "@/types/shop.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export function useLinkShop() {
  const { mutate: linkShop, isPending, error } = useShopLink();

  const form = useForm<ShopActionFormData>({
    resolver: zodResolver(shopActionSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      opening: "09:00",
      closing: "17:00",
      image: undefined,
      qr_image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      try {
        linkShop(data, {
          onSuccess: async (result) => {
            if (result.success) {
              await authClient.updateUser({ shop_id: result.data.id });
              form.reset();
            }
          },
        });
      } catch {
        // TODO: Loggind
        form.setError("image", {
          type: "manual",
          message: "Image upload failed. Please try again.",
        });
      }
    }),
  };

  useEffect(() => {
    if (error?.message) {
      toast.error(error.message);
    }
  }, [error?.message]);
  return {
    form,
    state,
    handlers,
  };
}

type UpdateShopProps = {
  shop: ShopWithOwner;
};

export function useUpdateShop({ shop }: UpdateShopProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutate: updateShop, isPending, error } = useShopUpdate();

  const form = useForm<ShopActionFormData>({
    resolver: zodResolver(shopActionSchema),
    defaultValues: {
      name: shop.name,
      description: shop.description || "",
      location: shop.location,
      opening: shop.opening,
      closing: shop.closing,
      image_key: shop.image_key || undefined,
      image: undefined,
      qr_image: undefined,
      qr_image_key: shop.qr_image_key || undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      try {
        updateShop(data, {
          onSuccess: (result) => {
            if (result.success) {
              setIsDialogOpen(false);
              form.reset();
            }
          },
        });
      } catch {
        // TODO: Loggind
        form.setError("image_key", {
          type: "manual",
          message: "Shop update failed. Please try again.",
        });
      }
    }),
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
  };

  return {
    form,
    state,
    handlers,
    isDialogOpen,
    setIsDialogOpen,
  };
}
