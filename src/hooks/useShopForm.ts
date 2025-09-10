"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useImageUpload, useShopLink, useShopUpdate } from "@/hooks";
import { useImageDelete } from "@/hooks/tanstack";
import { ImageUtils } from "@/lib/utils-functions/image.utils";
import { FormState } from "@/types";
import { ShopWithOwner } from "@/types/shop.types";
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

type UpdateShopProps = {
  shop: ShopWithOwner;
};

export function useUpdateShop({ shop }: UpdateShopProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutate: updateShop, isPending, error } = useShopUpdate();

  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useImageUpload();
  const { mutate: deleteImage } = useImageDelete();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: shop.name,
      description: shop.description || "",
      location: shop.location,
      opening: shop.opening,
      closing: shop.closing,
      imageKey: shop.imageKey
        ? ImageUtils.getImageUrl(shop.imageKey)
        : undefined,
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
        let finalImageKey: string | null = shop.imageKey;
        const oldImageKey = shop.imageKey;

        if (data.imageKey instanceof File) {
          finalImageKey = await uploadImage(data.imageKey);
        } else {
          finalImageKey = ImageUtils.processImageKeyForSubmission(
            data.imageKey || "",
            shop.imageKey || ""
          );
        }

        const processedData = { ...data, imageKey: finalImageKey };

        updateShop(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              if (oldImageKey && oldImageKey !== finalImageKey) {
                deleteImage(oldImageKey);
              }
              setIsDialogOpen(false);
              form.reset({
                ...processedData,
                imageKey: finalImageKey
                  ? ImageUtils.getImageUrl(finalImageKey)
                  : undefined,
              });
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
