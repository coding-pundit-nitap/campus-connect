"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useShopLink, useShopUpdate } from "@/hooks";
import { FormState } from "@/types";
import { ShopWithOwner } from "@/types/shop.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export function useLinkShop() {
  const { mutate: linkShop, isPending, error } = useShopLink();
  const { update } = useSession();

  const form = useForm<ShopActionFormData>({
    resolver: zodResolver(shopActionSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      opening: "09:00",
      closing: "17:00",
      image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      console.log("Submitting form with data:", data);
      try {
        linkShop(data, {
          onSuccess: async (result) => {
            if (result.success) {
              await update({ shop_id: result.data.id });
              form.reset();
            }
          },
        });
      } catch (uploadError) {
        console.error("Shop image upload failed:", uploadError);
        form.setError("image", {
          type: "manual",
          message: "Image upload failed. Please try again.",
        });
      }
    }),
  };

  useEffect(() => {
    if (error?.message) toast.error(error.message);
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
      imageKey: shop.imageKey || undefined,
      image: undefined,
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
      } catch (error) {
        console.error("Shop update failed:", error);
        form.setError("imageKey", {
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
