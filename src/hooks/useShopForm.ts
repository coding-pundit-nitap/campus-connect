"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useImageUpload, useShopLink } from "@/hooks";
import { FormState } from "@/types";
import { ShopFormData, shopSchema } from "@/validations/shop";

export function useLinkShop() {
  const { mutate: linkShop, isPending, error } = useShopLink();
  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useImageUpload();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      opening: "09:00",
      closing: "17:00",
      imageKey: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending || isUploadingImage,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      try {
        let finalImageKey: string | null = null;

        if (data.imageKey instanceof File) {
          finalImageKey = await uploadImage(data.imageKey);
        }

        const processedData = { ...data, imageKey: finalImageKey };

        linkShop(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              form.reset();
            }
          },
        });
      } catch (uploadError) {
        console.error("Shop image upload failed:", uploadError);
        form.setError("imageKey", {
          type: "manual",
          message: "Image upload failed. Please try again.",
        });
      }
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
