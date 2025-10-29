"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useShopLink, useShopUpdate } from "@/hooks";
import { authClient } from "@/lib/auth-client";
import { FormState } from "@/types";
import { ShopWithOwner } from "@/types/shop.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export function useLinkShop() {
  const { mutate: linkShop, isPending, error } = useShopLink();

  const router = useRouter();

  const form = useForm<ShopActionFormData>({
    resolver: zodResolver(shopActionSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      opening: "07:00",
      closing: "20:00",
      image: undefined,
      qr_image: undefined,
      upi_id: "",
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
              router.push(`/owner-shops`);
              form.reset();
            }
          },
        });
      } catch {
        // TODO: Logging
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
  const router = useRouter();
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
      upi_id: shop.upi_id || undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error ? error.message : null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      updateShop(data, {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Shop updated successfully!");
            router.push("/owner-shops");
          } else {
            toast.error(result.details || "An unknown error occurred.");
          }
        },
        onError: (err) => {
          toast.error((err as Error).message || "Failed to update shop.");
        },
      });
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
