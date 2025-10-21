"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ImageUtils } from "@/lib/utils-functions";
import { FormState } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import { ProductActionFormData, productActionSchema } from "@/validations";

import {
  useImageDelete,
  useImageUpload,
  useShopProductsCreate,
  useShopProductsUpdate,
} from "./tanstack";

type Props = {
  product: SerializedProduct;
};

export function useUpdateProductForm({ product }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    mutate: updateProduct,
    isPending,
    error,
  } = useShopProductsUpdate(product.id);

  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useImageUpload();
  const { mutate: deleteImage } = useImageDelete();

  const form = useForm<ProductActionFormData>({
    resolver: zodResolver(productActionSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      imageKey: ImageUtils.getImageUrl(product.imageKey),
      discount: product.discount || 0,
      category: product.category?.name || "",
      image: undefined,
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
        let finalImageKey: string = product.imageKey;
        const oldImageKey = product.imageKey;

        if (data.image instanceof File) {
          finalImageKey = await uploadImage(data.image);
        } else if (data.imageKey) {
          finalImageKey = ImageUtils.processImageKeyForSubmission(
            data.imageKey,
            product.imageKey
          );
        }

        const processedData = { ...data, imageKey: finalImageKey };

        updateProduct(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              if (oldImageKey && oldImageKey !== finalImageKey) {
                deleteImage(oldImageKey);
              }
              setIsDialogOpen(false);
              form.reset({
                ...processedData,
                imageKey: ImageUtils.getImageUrl(finalImageKey),
              });
            }
          },
        });
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
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

export function useCreateProductForm() {
  const {
    mutateAsync: createProduct,
    isPending,
    error,
  } = useShopProductsCreate();

  const form = useForm<ProductActionFormData>({
    resolver: zodResolver(productActionSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      imageKey: undefined,
      discount: 0,
      category: "",
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
        await createProduct(data);
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
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
